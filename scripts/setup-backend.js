import { writeFileSync, mkdirSync } from "fs"

console.log("[v0] Setting up NestJS backend structure...")

// Create backend directory structure
const backendDirs = [
  "backend/src/modules/auth",
  "backend/src/modules/users",
  "backend/src/modules/products",
  "backend/src/modules/inventory",
  "backend/src/modules/sales",
  "backend/src/modules/outlets",
  "backend/src/modules/reports",
  "backend/src/common/guards",
  "backend/src/common/decorators",
  "backend/src/common/dto",
  "backend/src/database/entities",
  "backend/src/database/migrations",
]

backendDirs.forEach((dir) => {
  try {
    mkdirSync(dir, { recursive: true })
    console.log(`[v0] Created directory: ${dir}`)
  } catch (error) {
    console.log(`[v0] Directory already exists: ${dir}`)
  }
})

// Create package.json for backend
const packageJson = {
  name: "pharmacy-pos-backend",
  version: "1.0.0",
  description: "Pharmacy POS Management System Backend",
  main: "dist/main.js",
  scripts: {
    build: "nest build",
    format: 'prettier --write "src/**/*.ts" "test/**/*.ts"',
    start: "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    lint: 'eslint "{src,apps,libs,test}/**/*.ts" --fix',
    test: "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:debug":
      "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
    "test:e2e": "jest --config ./test/jest-e2e.json",
  },
  dependencies: {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/typeorm": "^10.0.0",
    "@nestjs/jwt": "^10.1.1",
    "@nestjs/passport": "^10.0.2",
    "@nestjs/config": "^3.1.1",
    typeorm: "^0.3.17",
    pg: "^8.11.3",
    bcryptjs: "^2.4.3",
    passport: "^0.6.0",
    "passport-jwt": "^4.0.1",
    "passport-local": "^1.0.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "reflect-metadata": "^0.1.13",
    rxjs: "^7.8.1",
  },
  devDependencies: {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/schematics": "^10.0.0",
    "@nestjs/testing": "^10.0.0",
    "@types/express": "^4.17.17",
    "@types/jest": "^29.5.2",
    "@types/node": "^20.3.1",
    "@types/supertest": "^2.0.12",
    "@types/bcryptjs": "^2.4.4",
    "@types/passport-jwt": "^3.0.9",
    "@types/passport-local": "^1.0.35",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    eslint: "^8.42.0",
    "eslint-config-prettier": "^9.0.0",
    "eslint-plugin-prettier": "^5.0.0",
    jest: "^29.5.0",
    prettier: "^3.0.0",
    "source-map-support": "^0.5.21",
    supertest: "^6.3.3",
    "ts-jest": "^29.1.0",
    "ts-loader": "^9.4.3",
    "ts-node": "^10.9.1",
    "tsconfig-paths": "^4.2.0",
    typescript: "^5.1.3",
  },
}

writeFileSync("backend/package.json", JSON.stringify(packageJson, null, 2))
console.log("[v0] Created backend/package.json")

// Create main.ts
const mainTs = `import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend
  app.enableCors({
    origin: ['http://localhost:3000', 'https://your-frontend-domain.com'],
    credentials: true,
  });
  
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  await app.listen(3001);
  console.log('Pharmacy POS Backend running on http://localhost:3001');
}
bootstrap();
`

writeFileSync("backend/src/main.ts", mainTs)
console.log("[v0] Created backend/src/main.ts")

console.log("[v0] Backend structure setup complete!")
