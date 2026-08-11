#!/bin/bash
# Diagnostico para configurar proxy reverso de mundoas.acessosaude.com.br -> Vercel
# Rode como root ou com sudo no servidor 107.174.34.133

echo "=== [1] Usuario e OS ==="
whoami
uname -a
cat /etc/os-release 2>/dev/null | head -5

echo ""
echo "=== [2] Web server instalado ==="
which nginx apache2 httpd 2>&1
echo "nginx version:"
nginx -v 2>&1
echo "apache2 version:"
apache2 -v 2>&1 | head -2

echo ""
echo "=== [3] Modulos do nginx (proxy/SSL) ==="
nginx -V 2>&1 | tr ' ' '\n' | grep -E 'http_ssl_module|http_v2_module|with-stream'

echo ""
echo "=== [4] Sites disponiveis no nginx ==="
ls -la /etc/nginx/sites-available/ 2>&1 | head -20
echo ""
echo "--- sites-enabled ---"
ls -la /etc/nginx/sites-enabled/ 2>&1 | head -20

echo ""
echo "=== [5] VirtualHosts do apache ==="
ls -la /etc/apache2/sites-available/ 2>&1 | head -20
echo "--- sites-enabled ---"
ls -la /etc/apache2/sites-enabled/ 2>&1 | head -20

echo ""
echo "=== [6] Procurar config existente para mundoas / asaqui ==="
grep -r "mundoas.acessosaude" /etc/nginx/ /etc/apache2/ 2>/dev/null | head -20
grep -r "asaqui.acessosaude" /etc/nginx/ /etc/apache2/ 2>/dev/null | head -20

echo ""
echo "=== [7] Certificado SSL existente ==="
ls -la /etc/letsencrypt/live/ 2>&1 | head -20
echo "--- certbot ---"
which certbot 2>&1
certbot --version 2>&1

echo ""
echo "=== [8] O mundoas.acessosaude.com.br ja responde localmente? ==="
curl -skI -H 'Host: mundoas.acessosaude.com.br' http://127.0.0.1 --max-time 5 2>&1 | head -10

echo ""
echo "=== [9] Disco / espaco ==="
df -h /etc /var/www 2>&1 | head -5

echo ""
echo "=== [10] Firewall ==="
which ufw iptables 2>&1
ufw status 2>&1 | head -10
