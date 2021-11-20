import { randomBytes } from 'crypto';


let count = 0;

export function maildirFilename(): string {
   return `R${randomBytes(8).toString('hex')}P${process.pid}Q${++count}`;
}
