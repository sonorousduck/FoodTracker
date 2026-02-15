import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration202602142343481771137829067 implements MigrationInterface {
    name = 'Migration202602142343481771137829067'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`food_entry\` DROP FOREIGN KEY \`FK_e8dc249f96ab67dd34458c84d44\``);
        await queryRunner.query(`ALTER TABLE \`friendship\` DROP FOREIGN KEY \`FK_8012340b570c83b55e0d3ef829a\``);
        await queryRunner.query(`ALTER TABLE \`friendship\` DROP FOREIGN KEY \`FK_b29f15b88ee36453605ade63cb2\``);
        await queryRunner.query(`DROP INDEX \`uq_friendship_requester_addressee\` ON \`friendship\``);
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`refreshTokenExpiresAt\``);
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`refreshTokenHash\``);
        await queryRunner.query(`ALTER TABLE \`friendship\` CHANGE \`createdAt\` \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`friendship\` CHANGE \`updatedAt\` \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_48a37dcc1431c47e2d92b2f404\` ON \`friendship\` (\`requesterId\`, \`addresseeId\`)`);
        await queryRunner.query(`ALTER TABLE \`food_entry\` ADD CONSTRAINT \`FK_e8dc249f96ab67dd34458c84d44\` FOREIGN KEY (\`recipeId\`) REFERENCES \`recipe\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`friendship\` ADD CONSTRAINT \`FK_b29f15b88ee36453605ade63cb2\` FOREIGN KEY (\`requesterId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`friendship\` ADD CONSTRAINT \`FK_8012340b570c83b55e0d3ef829a\` FOREIGN KEY (\`addresseeId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`friendship\` DROP FOREIGN KEY \`FK_8012340b570c83b55e0d3ef829a\``);
        await queryRunner.query(`ALTER TABLE \`friendship\` DROP FOREIGN KEY \`FK_b29f15b88ee36453605ade63cb2\``);
        await queryRunner.query(`ALTER TABLE \`food_entry\` DROP FOREIGN KEY \`FK_e8dc249f96ab67dd34458c84d44\``);
        await queryRunner.query(`DROP INDEX \`IDX_48a37dcc1431c47e2d92b2f404\` ON \`friendship\``);
        await queryRunner.query(`ALTER TABLE \`friendship\` CHANGE \`updatedAt\` \`updatedAt\` datetime(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE \`friendship\` CHANGE \`createdAt\` \`createdAt\` datetime(0) NOT NULL DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`refreshTokenHash\` varchar(64) NULL`);
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`refreshTokenExpiresAt\` timestamp NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`uq_friendship_requester_addressee\` ON \`friendship\` (\`requesterId\`, \`addresseeId\`)`);
        await queryRunner.query(`ALTER TABLE \`friendship\` ADD CONSTRAINT \`FK_b29f15b88ee36453605ade63cb2\` FOREIGN KEY (\`requesterId\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`friendship\` ADD CONSTRAINT \`FK_8012340b570c83b55e0d3ef829a\` FOREIGN KEY (\`addresseeId\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`food_entry\` ADD CONSTRAINT \`FK_e8dc249f96ab67dd34458c84d44\` FOREIGN KEY (\`recipeId\`) REFERENCES \`recipe\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
