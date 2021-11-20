DevMailer
=========

DevMailer helps developing and testing applications that send email through a preconfigured SMTP smarthost. It’s a useful development tool but it is **absolutely inappropriate for production**.

DevMailer provides two services:

* An SMTP server on port 2525 that accepts any mail and just stores it locally.
* An IMAP server on port 143 that provides access to this local mail for your favorite mail user agent.

Just run this image, configure your application to use DevMailer’s SMTP server and configure your MUA to use DevMailer’s IMAP server. The SMTP server does not require authentication. The IMAP server user name and password is `devmailer`. Did I tell you not to use DevMailer in production?


Implementation details
----------------------

* DevMailer’s SMTP server is a tiny [Node.js](https://nodejs.org/) application written in [TypeScript](https://www.typescriptlang.org/). It uses the [smtp-server](https://www.npmjs.com/package/smtp-server) package.
* DevMailer’s IMAP server is a vanilla [dovecot](https://www.dovecot.org/) instance with minimal configuration.


Running DevMailer
-----------------

* simple: `docker run --rm -p 127.0.0.1:25:2525 -p 127.0.0.1:143:143 leptonite/devmailer`  
  This way your local mailbox will be stored inside your container and will be lost as soon as the container stops.
* recommended: `docker run --rm --read-only --tmpfs /run --tmpfs /var/lib/dovecot -p 127.0.0.1:25:2525 -p 127.0.0.1:143:143 -v devmailer-maildir:/maildir leptonite/devmailer`  
  This way your local mailbox will be stored in the docker volume `devmailer-maildir` where it survives container restarts.

Be careful to include `127.0.0.1:` in your port mappings, especially if your machine is connected to an untrusted network.
