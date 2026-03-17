import { ChildProcess, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

import { DATA_DIR } from './config.js';
import { assertValidGroupFolder } from './group-folder.js';
import { logger } from './logger.js';

const HOME_DIR = process.env.HOME || os.homedir();
const HOST_COMMANDS_CONFIG_PATH = path.join(
  HOME_DIR,
  '.config',
  'nanoclaw',
  'host-commands.json',
);

interface HostCommandConfig {
  label: string;
  command: string;
  cwd: string;
  mode: 'one-shot' | 'long-running';
  allowedGroups: string[];
}

interface HostCommandsFile {
  commands: Record<string, HostCommandConfig>;
}

interface HostCommandResult {
  status: 'ok' | 'error';
  message: string;
  output?: string;
  pid?: number;
}

// Track running long-running processes
const runningProcesses = new Map<
  string,
  { process: ChildProcess; logFile: string }
>();

function loadConfig(): HostCommandsFile | null {
  try {
    if (!fs.existsSync(HOST_COMMANDS_CONFIG_PATH)) {
      logger.warn(
        'Host commands config not found at %s',
        HOST_COMMANDS_CONFIG_PATH,
      );
      return null;
    }
    return JSON.parse(fs.readFileSync(HOST_COMMANDS_CONFIG_PATH, 'utf-8'));
  } catch (err) {
    logger.error({ err }, 'Failed to load host commands config');
    return null;
  }
}

function writeResult(
  sourceGroup: string,
  requestId: string,
  result: HostCommandResult,
): void {
  assertValidGroupFolder(sourceGroup);
  const resultsDir = path.join(
    DATA_DIR,
    'ipc',
    sourceGroup,
    'host_command_results',
  );
  fs.mkdirSync(resultsDir, { recursive: true });
  fs.writeFileSync(
    path.join(resultsDir, `${requestId}.json`),
    JSON.stringify(result, null, 2),
  );
}

function getLogFile(sourceGroup: string, commandId: string): string {
  assertValidGroupFolder(sourceGroup);
  const logsDir = path.join(DATA_DIR, 'ipc', sourceGroup, 'host_command_logs');
  fs.mkdirSync(logsDir, { recursive: true });
  return path.join(logsDir, `${commandId}.log`);
}

function handleStart(
  commandId: string,
  config: HostCommandConfig,
  sourceGroup: string,
  requestId: string,
): void {
  if (config.mode === 'long-running') {
    // Check if already running
    const existing = runningProcesses.get(commandId);
    if (existing && existing.process.pid && !existing.process.killed) {
      try {
        process.kill(existing.process.pid, 0); // Check if alive
        writeResult(sourceGroup, requestId, {
          status: 'ok',
          message: `"${commandId}" is already running (PID ${existing.process.pid}).`,
          pid: existing.process.pid,
        });
        return;
      } catch {
        // Process is dead, clean up and start new one
        runningProcesses.delete(commandId);
      }
    }

    const logFile = getLogFile(sourceGroup, commandId);
    const logStream = fs.createWriteStream(logFile, { flags: 'w' });

    const child = spawn('bash', ['-c', config.command], {
      cwd: config.cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true,
    });

    child.stdout?.pipe(logStream);
    child.stderr?.pipe(logStream);

    child.on('error', (err) => {
      logger.error({ err, commandId }, 'Host command failed to start');
      logStream.write(`\n[ERROR] Failed to start: ${err.message}\n`);
      runningProcesses.delete(commandId);
    });

    child.on('exit', (code, signal) => {
      logStream.write(
        `\n[EXIT] Process exited with code ${code}, signal ${signal}\n`,
      );
      logStream.end();
      runningProcesses.delete(commandId);
    });

    runningProcesses.set(commandId, { process: child, logFile });

    logger.info(
      { commandId, pid: child.pid, sourceGroup },
      'Long-running host command started',
    );

    writeResult(sourceGroup, requestId, {
      status: 'ok',
      message: `Started "${commandId}" (PID ${child.pid}). Check logs for output.`,
      pid: child.pid,
    });
  } else {
    // One-shot: spawn and collect output
    const child = spawn('bash', ['-c', config.command], {
      cwd: config.cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', (data: Buffer) => {
      stdout += data.toString();
    });
    child.stderr?.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    const timeout = setTimeout(() => {
      child.kill('SIGKILL');
    }, 60_000);

    child.on('exit', (code) => {
      clearTimeout(timeout);
      const output = (stdout + '\n' + stderr).trim().slice(-4000);
      if (code !== 0) {
        writeResult(sourceGroup, requestId, {
          status: 'error',
          message: `Command failed with exit code ${code}.`,
          output,
        });
      } else {
        writeResult(sourceGroup, requestId, {
          status: 'ok',
          message: `Command completed successfully.`,
          output,
        });
      }
    });

    child.on('error', (err) => {
      clearTimeout(timeout);
      writeResult(sourceGroup, requestId, {
        status: 'error',
        message: `Command failed to start: ${err.message}`,
      });
    });
  }
}

function handleStop(
  commandId: string,
  sourceGroup: string,
  requestId: string,
): void {
  const existing = runningProcesses.get(commandId);
  if (!existing || !existing.process.pid) {
    writeResult(sourceGroup, requestId, {
      status: 'ok',
      message: `"${commandId}" is not running.`,
    });
    return;
  }

  const pid = existing.process.pid;

  try {
    // Kill the process group (negative PID) to kill all children
    process.kill(-pid, 'SIGTERM');
  } catch {
    try {
      existing.process.kill('SIGTERM');
    } catch {
      // Already dead
    }
  }

  // Force kill after 5 seconds
  setTimeout(() => {
    try {
      process.kill(-pid, 'SIGKILL');
    } catch {
      // Already dead
    }
  }, 5000);

  runningProcesses.delete(commandId);

  logger.info({ commandId, sourceGroup }, 'Long-running host command stopped');

  writeResult(sourceGroup, requestId, {
    status: 'ok',
    message: `Stopped "${commandId}".`,
  });
}

function handleStatus(
  commandId: string,
  sourceGroup: string,
  requestId: string,
): void {
  const existing = runningProcesses.get(commandId);
  if (!existing || !existing.process.pid) {
    writeResult(sourceGroup, requestId, {
      status: 'ok',
      message: `"${commandId}" is not running.`,
    });
    return;
  }

  try {
    process.kill(existing.process.pid, 0); // Check if alive
    writeResult(sourceGroup, requestId, {
      status: 'ok',
      message: `"${commandId}" is running (PID ${existing.process.pid}).`,
      pid: existing.process.pid,
    });
  } catch {
    runningProcesses.delete(commandId);
    writeResult(sourceGroup, requestId, {
      status: 'ok',
      message: `"${commandId}" is not running (process exited).`,
    });
  }
}

export function executeHostCommand(
  data: {
    commandId: string;
    action: string;
    requestId: string;
  },
  sourceGroup: string,
): void {
  const { commandId, action, requestId } = data;

  const config = loadConfig();
  if (!config) {
    writeResult(sourceGroup, requestId, {
      status: 'error',
      message: 'Host commands config not found.',
    });
    return;
  }

  const cmdConfig = config.commands[commandId];
  if (!cmdConfig) {
    writeResult(sourceGroup, requestId, {
      status: 'error',
      message: `Unknown command: "${commandId}".`,
    });
    return;
  }

  // Authorization: check if this group is allowed to run this command
  if (!cmdConfig.allowedGroups.includes(sourceGroup)) {
    logger.warn(
      { commandId, sourceGroup, allowedGroups: cmdConfig.allowedGroups },
      'Host command blocked: group not authorized',
    );
    writeResult(sourceGroup, requestId, {
      status: 'error',
      message: `Group "${sourceGroup}" is not authorized to run "${commandId}".`,
    });
    return;
  }

  switch (action) {
    case 'start':
      handleStart(commandId, cmdConfig, sourceGroup, requestId);
      break;
    case 'stop':
      handleStop(commandId, sourceGroup, requestId);
      break;
    case 'status':
      handleStatus(commandId, sourceGroup, requestId);
      break;
    default:
      writeResult(sourceGroup, requestId, {
        status: 'error',
        message: `Unknown action: "${action}".`,
      });
  }
}

/**
 * Sync host commands config to a group's IPC directory so the container agent
 * can read available commands. Only includes commands allowed for this group.
 */
export function syncHostCommandsToGroup(groupFolder: string): void {
  const config = loadConfig();
  if (!config) return;

  assertValidGroupFolder(groupFolder);
  const ipcDir = path.join(DATA_DIR, 'ipc', groupFolder);

  // Filter to only commands this group is allowed to use
  const filtered: HostCommandsFile = { commands: {} };
  for (const [id, cmd] of Object.entries(config.commands)) {
    if (cmd.allowedGroups.includes(groupFolder)) {
      filtered.commands[id] = {
        ...cmd,
        // Strip cwd for security — agent doesn't need host paths
        cwd: '(host)',
      };
    }
  }

  if (Object.keys(filtered.commands).length > 0) {
    fs.mkdirSync(ipcDir, { recursive: true });
    fs.writeFileSync(
      path.join(ipcDir, 'host_commands.json'),
      JSON.stringify(filtered, null, 2),
    );
  }
}
