import { parseIntStrict } from '@leptonite/parse-int-strict';

import { CliError } from './CliError.js';


export class Config {

   private constructor(
      public readonly host: string | undefined,
      public readonly port: number,
      public readonly maildir: string,
   ) {
   }

   public static fromCommandLine(args: Array<string>): Config {
      let host: string | undefined;
      let port: number | undefined;
      let maildir: string | undefined;
      for (const arg of args) {
         if (arg.startsWith('--host=')) {
            if (host !== undefined) {
               throw new CliError('multiple --host options not supported');
            }
            host = arg.substr('--host='.length);
         }
         else if (arg.startsWith('--port=')) {
            if (port !== undefined) {
               throw new CliError('multiple --port options not supported');
            }
            port = parseIntStrict(arg.substr('--port='.length));
            if (Number.isNaN(port) || port < 1 || port > 65535) {
               throw new CliError('invalid port');
            }
         }
         else if (arg.startsWith('--maildir=')) {
            if (maildir !== undefined) {
               throw new CliError('multiple --maildir options not supported');
            }
            maildir = arg.substr('--maildir='.length);
         }
         else {
            throw new CliError(`unexpected option: ${arg}`);
         }
      }
      if (port === undefined) {
         throw new CliError('missing --port option');
      }
      if (maildir === undefined) {
         throw new CliError('missing --maildir option');
      }
      return new Config(host, port, maildir);
   }

}
