import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { Module } from "@nestjs/common";

import { UsersModule } from "./users/users.module";
import { AppController } from "./app.controller";
import { AuthModule } from "./auth/auth.module";
import { AppService } from "./app.service";

@Module({
  imports: [
    AuthModule,
    UsersModule,
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: "mysql",
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT ?? "3306"),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: true, // TODO: Remove! This isn't safe for production code
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
