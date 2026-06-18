# greenhouse-automation

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).

## Deployment — Apache2 with SSL on Raspberry Pi

These steps deploy the built app as a static site served by `apache2` on a Raspberry Pi with HTTPS (Let's Encrypt).

Prerequisites:
- Raspberry Pi with a public domain name pointing to its IP (e.g. `example.com`).
- SSH access to the Pi (user `pi` or another sudo user).
- DNS A record for your domain.

1) Build the app (locally or on the Pi):

```
npm ci
npm run build
```

2) Transfer the built files to the Pi (example using `rsync`):

```
# from your dev machine
rsync -avz --delete dist/ pi@your-pi.example.com:/tmp/geothermal-dist/
ssh pi@your-pi.example.com sudo mkdir -p /var/www/html
sudo rsync -avz --delete /tmp/geothermal-dist/ /var/www/html/
```

3) Install and enable Apache + Certbot on the Pi:

```
sudo apt update
sudo apt install -y apache2 certbot python3-certbot-apache
sudo a2enmod rewrite headers
sudo systemctl restart apache2
```

4) Configure an Apache virtual host for your domain (create `/etc/apache2/sites-available/geothermal.conf`):

```
<VirtualHost *:80>
	ServerName example.com
	ServerAlias www.example.com
	DocumentRoot /var/www/html

		<Directory /var/www/html>
		Options Indexes FollowSymLinks
		AllowOverride All
		Require all granted
	</Directory>

	# SPA fallback to index.html
	RewriteEngine On
	RewriteCond %{REQUEST_FILENAME} !-f
	RewriteRule ^ /index.html [L]
</VirtualHost>
```

Enable the site and reload Apache:

```
sudo a2ensite geothermal
sudo systemctl reload apache2
```

5) Obtain an SSL certificate with Certbot (will auto-configure Apache):

```
sudo certbot --apache -d example.com -d www.example.com
```

Follow the interactive prompts to enable HTTPS. Certbot will update the virtual host to use the certificate.

6) Set ownership and permissions:

```
sudo chown -R www-data:www-data /var/www/html
sudo find /var/www/html -type d -exec chmod 755 {} +
sudo find /var/www/html -type f -exec chmod 644 {} +
```

7) Firewall and ports (if using `ufw`):

```
sudo ufw allow 'Apache Full'
sudo ufw enable
```

8) Verify
- Visit `https://example.com` and check the site loads and is served over HTTPS.
- Check `sudo systemctl status apache2` and `sudo certbot renew --dry-run` for renewal tests.

Notes / troubleshooting:
- If routes 404 on refresh, ensure the rewrite rule (SPA fallback) is present and `mod_rewrite` is enabled.
- You can build on the Pi directly if you prefer: install Node.js (use NodeSource or `nvm`) and run `npm ci && npm run build`.
- For automated deployments, consider a CI job that builds and rsyncs `dist/` to the Pi.

