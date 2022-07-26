set -e
rm -rf db/migrations/*.js
npx sqd codegen
npm run build
npx sqd db drop
npx sqd db create
npx sqd db create-migration Init
npx sqd db migrate
node -r dotenv/config lib/processor.js