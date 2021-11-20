#!/usr/bin/env node

import { CliError } from './CliError.js';
import { main } from './main.js';

main().catch(e => console.error(e instanceof CliError ? `ERROR: ${e.message}` : e));
