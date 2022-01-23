import { ok as assert } from 'assert';
import { ENOENT } from 'constants';
import { createWriteStream, promises as fs, Stats } from 'fs';
import * as path from 'path';

import { SMTPServer, SMTPServerDataStream, SMTPServerSession } from 'smtp-server';

import { CliError } from './CliError.js';
import { maildirFilename } from './maildirFilename.js';


export interface SimpleSmtpServerConfig {
   readonly host?: string;
   readonly port: number;
   readonly maildir: string;
}

export class SimpleSmtpServer {

   private readonly host: string | undefined;
   private readonly port: number;
   private readonly maildir: string;

   private state: 'off' | 'starting' | 'running' | 'stopping' = 'off';
   private smtpServer: SMTPServer | undefined;

   public constructor(config: SimpleSmtpServerConfig) {
      this.validateConfig(config);
      this.host = config.host;
      this.port = config.port;
      this.maildir = config.maildir;
   }

   public async start(): Promise<void> {
      if (this.state !== 'off') {
         throw new Error(`cannot start server because it’s ${this.state} right now`);
      }
      assert(this.smtpServer === undefined, `state === '${this.state}' && smtpServer !== undefined`);

      this.state = 'starting';
      try {
         this.smtpServer = await this.startSmtpServer();
         this.state = 'running';
      } catch (e) {
         this.state = 'off';
         throw e;
      }
   }

   public async stop(): Promise<void> {
      if (this.state !== 'running') {
         throw new Error(`cannot start server because it’s ${this.state} right now`);
      }

      console.info('stopping server...');
      await new Promise<void>(resolve => {
         assert(this.smtpServer !== undefined, `state === '${this.state}' && smtpServer === undefined`);
         this.state = 'stopping';
         this.smtpServer.close(resolve);
      });
      console.info('server stopped');
   }

   private async startSmtpServer(): Promise<SMTPServer> {
      await this.prepareMaildir();

      const smtpServer = new SMTPServer({
         disableReverseLookup: true,
         authOptional: true,
         onConnect: (session, callback) => this.onConnect(session).then(callback as () => void, callback),
         onClose: (session, callback) => this.onDisconnect(session).then(callback as () => void, callback),
         onData: (stream, session, callback) => this.onData(session, stream).then(callback as () => void, callback),
      });

      console.info('starting server...');
      await new Promise<void>((resolve, reject) => {
         const errorCallback = (error: unknown) => {
            smtpServer.off('error', errorCallback);
            reject(error);
         };
         smtpServer.on('error', errorCallback);
         smtpServer.listen(this.port, this.host, () => {
            smtpServer.off('error', errorCallback);
            resolve();
         });
      });
      console.info('server started');

      return smtpServer;
   }

   private validateConfig(config: SimpleSmtpServerConfig): void {
      if (!Number.isSafeInteger(config.port) || config.port < 1 || config.port > 65535) {
         throw new Error('invalid port');
      }
   }

   private async prepareMaildir(): Promise<void> {
      let stats: Stats;
      try {
         stats = await fs.stat(this.maildir);
      } catch (e) {
         if (e !== null && typeof e === 'object' && (e as any).errno === -ENOENT) {
            throw new CliError('given maildir does not exist');
         }
         throw e;
      }

      if (!stats.isDirectory()) {
         throw new CliError('given maildir is not a directory');
      }
      for (const dir of ['cur', 'new', 'tmp']) {
         await fs.mkdir(path.join(this.maildir, dir), { recursive: true });
      }
   }

   private async onConnect(session: SMTPServerSession): Promise<void> {
      console.info(`new connection from ${this.addressString(session.remoteAddress, session.remotePort)}`);
   }

   private async onData(session: SMTPServerSession, stream: SMTPServerDataStream): Promise<void> {
      const basename = maildirFilename();
      const tmpFile = path.join(this.maildir, 'tmp', basename);
      const newFile = path.join(this.maildir, 'new', basename);
      const writeStream = createWriteStream(tmpFile);
      await new Promise(resolve => {
         writeStream.write(`X-DevMailer-Debug: ${JSON.stringify(session)}\r\n`, resolve);
      });
      await new Promise<void>(resolve => {
         stream.on('end', async () => {
            await new Promise(resolve => writeStream.close(resolve));
            await fs.rename(tmpFile, newFile);
            console.info(`written new mail to ${newFile}`);
            resolve();
         });
         stream.pipe(writeStream);
      });
   }

   private async onDisconnect(session: SMTPServerSession): Promise<void> {
      console.info(`connection from ${this.addressString(session.remoteAddress, session.remotePort)} closed`);
   }

   private addressString(addr: string, port: number): string {
      return (addr.includes(':') ? `[${addr}]` : addr) + ':' + port;
   }

}
