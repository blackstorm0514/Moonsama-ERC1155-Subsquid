module.exports = class Init1658715268718 {
  name = 'Init1658715268718'

  async up(db) {
    await db.query(`CREATE TABLE "owner" ("id" character varying NOT NULL, CONSTRAINT "PK_8e86b6b9f94aece7d12d465dc0c" PRIMARY KEY ("id"))`)
    await db.query(`CREATE TABLE "token_owner" ("id" character varying NOT NULL, "balance" numeric NOT NULL, "owner_id" character varying NOT NULL, "token_id" character varying NOT NULL, CONSTRAINT "PK_77fa31a311c711698a0b9443823" PRIMARY KEY ("id"))`)
    await db.query(`CREATE INDEX "IDX_a57f703e7051825fc552e270ad" ON "token_owner" ("owner_id") `)
    await db.query(`CREATE INDEX "IDX_f4809908af2b44cee55172a681" ON "token_owner" ("token_id") `)
    await db.query(`CREATE TABLE "metadata" ("id" character varying NOT NULL, "name" text, "description" text, "image" text, "attributes" jsonb, "animation_url" text, "type" text, CONSTRAINT "PK_56b22355e89941b9792c04ab176" PRIMARY KEY ("id"))`)
    await db.query(`CREATE TABLE "transfer" ("id" character varying NOT NULL, "timestamp" numeric NOT NULL, "block" numeric NOT NULL, "transaction_hash" text NOT NULL, "token_id" character varying NOT NULL, "from_id" character varying, "to_id" character varying, CONSTRAINT "PK_fd9ddbdd49a17afcbe014401295" PRIMARY KEY ("id"))`)
    await db.query(`CREATE INDEX "IDX_b27b1150b8a7af68424540613c" ON "transfer" ("token_id") `)
    await db.query(`CREATE INDEX "IDX_76bdfed1a7eb27c6d8ecbb7349" ON "transfer" ("from_id") `)
    await db.query(`CREATE INDEX "IDX_0751309c66e97eac9ef1149362" ON "transfer" ("to_id") `)
    await db.query(`CREATE TABLE "contract" ("id" character varying NOT NULL, "name" text, "symbol" text, CONSTRAINT "PK_17c3a89f58a2997276084e706e8" PRIMARY KEY ("id"))`)
    await db.query(`CREATE TABLE "token" ("id" character varying NOT NULL, "total_supply" numeric, "numeric_id" numeric NOT NULL, "uri" text, "meta_id" character varying, "contract_id" character varying, CONSTRAINT "PK_82fae97f905930df5d62a702fc9" PRIMARY KEY ("id"))`)
    await db.query(`CREATE INDEX "IDX_c04f28dafc8c7c5b34d3ac8b90" ON "token" ("meta_id") `)
    await db.query(`CREATE INDEX "IDX_5c85dbbd108d915a13f71de39a" ON "token" ("contract_id") `)
    await db.query(`ALTER TABLE "token_owner" ADD CONSTRAINT "FK_a57f703e7051825fc552e270ad7" FOREIGN KEY ("owner_id") REFERENCES "owner"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    await db.query(`ALTER TABLE "token_owner" ADD CONSTRAINT "FK_f4809908af2b44cee55172a6814" FOREIGN KEY ("token_id") REFERENCES "token"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    await db.query(`ALTER TABLE "transfer" ADD CONSTRAINT "FK_b27b1150b8a7af68424540613c7" FOREIGN KEY ("token_id") REFERENCES "token"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    await db.query(`ALTER TABLE "transfer" ADD CONSTRAINT "FK_76bdfed1a7eb27c6d8ecbb73496" FOREIGN KEY ("from_id") REFERENCES "owner"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    await db.query(`ALTER TABLE "transfer" ADD CONSTRAINT "FK_0751309c66e97eac9ef11493623" FOREIGN KEY ("to_id") REFERENCES "owner"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    await db.query(`ALTER TABLE "token" ADD CONSTRAINT "FK_c04f28dafc8c7c5b34d3ac8b903" FOREIGN KEY ("meta_id") REFERENCES "metadata"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    await db.query(`ALTER TABLE "token" ADD CONSTRAINT "FK_5c85dbbd108d915a13f71de39ad" FOREIGN KEY ("contract_id") REFERENCES "contract"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
  }

  async down(db) {
    await db.query(`DROP TABLE "owner"`)
    await db.query(`DROP TABLE "token_owner"`)
    await db.query(`DROP INDEX "public"."IDX_a57f703e7051825fc552e270ad"`)
    await db.query(`DROP INDEX "public"."IDX_f4809908af2b44cee55172a681"`)
    await db.query(`DROP TABLE "metadata"`)
    await db.query(`DROP TABLE "transfer"`)
    await db.query(`DROP INDEX "public"."IDX_b27b1150b8a7af68424540613c"`)
    await db.query(`DROP INDEX "public"."IDX_76bdfed1a7eb27c6d8ecbb7349"`)
    await db.query(`DROP INDEX "public"."IDX_0751309c66e97eac9ef1149362"`)
    await db.query(`DROP TABLE "contract"`)
    await db.query(`DROP TABLE "token"`)
    await db.query(`DROP INDEX "public"."IDX_c04f28dafc8c7c5b34d3ac8b90"`)
    await db.query(`DROP INDEX "public"."IDX_5c85dbbd108d915a13f71de39a"`)
    await db.query(`ALTER TABLE "token_owner" DROP CONSTRAINT "FK_a57f703e7051825fc552e270ad7"`)
    await db.query(`ALTER TABLE "token_owner" DROP CONSTRAINT "FK_f4809908af2b44cee55172a6814"`)
    await db.query(`ALTER TABLE "transfer" DROP CONSTRAINT "FK_b27b1150b8a7af68424540613c7"`)
    await db.query(`ALTER TABLE "transfer" DROP CONSTRAINT "FK_76bdfed1a7eb27c6d8ecbb73496"`)
    await db.query(`ALTER TABLE "transfer" DROP CONSTRAINT "FK_0751309c66e97eac9ef11493623"`)
    await db.query(`ALTER TABLE "token" DROP CONSTRAINT "FK_c04f28dafc8c7c5b34d3ac8b903"`)
    await db.query(`ALTER TABLE "token" DROP CONSTRAINT "FK_5c85dbbd108d915a13f71de39ad"`)
  }
}
