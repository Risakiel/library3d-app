#!/bin/sh
# Au demarrage (ex: reboot Unraid), PostgreSQL peut ne pas encore accepter les
# connexions. On retente la synchronisation du schema avec un delai croissant
# au lieu de quitter, ce qui laissait le conteneur arrete.
delay=2
max_delay=30
attempt=1

until npx prisma db push --skip-generate --accept-data-loss; do
  echo "[start] Base de donnees indisponible (tentative $attempt), nouvel essai dans ${delay}s..."
  sleep "$delay"
  attempt=$((attempt + 1))
  delay=$((delay * 2))
  [ "$delay" -gt "$max_delay" ] && delay=$max_delay
done

echo "[start] Base de donnees prete, lancement de l'application"
exec npm run start
