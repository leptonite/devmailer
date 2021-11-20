import { Config } from './Config.js';
import { SimpleSmtpServer } from './SimpleSmtpServer.js';


export async function main(): Promise<void> {
   const config = Config.fromCommandLine(process.argv.slice(2));

   const server = new SimpleSmtpServer(config);
   await server.start();

   process.on('SIGINT', async () => {
      console.info('SIGINT');
      await server.stop();
   });
}
