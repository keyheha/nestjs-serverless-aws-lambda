import { Handler, Context } from 'aws-lambda'
import { NestFactory } from '@nestjs/core'
import { ExpressAdapter } from '@nestjs/platform-express'
import { AppModule } from './app.module'
import { RequestListener } from 'http'
import * as express from 'express'
require('source-map-support/register')
const serverlessExpress = require('@vendia/serverless-express')
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { INestApplication } from '@nestjs/common'

let cachedApp: RequestListener

function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Cats example')
    .setDescription('The cats API description')
    .setVersion('1.0')
    .addTag('cats')
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api', app, document)
}

async function bootstrapServer(): Promise<any> {
  if (!cachedApp) {
    const expressApp = express()
    const nestApp = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp),
    )
    setupSwagger(nestApp)
    nestApp.enableCors()
    await nestApp.init()
    cachedApp = expressApp
  }
  return cachedApp
}
export const handler: Handler = async (
  event: any,
  context: Context,
  callback: any,
) => {
  if (event.path === '/api') {
    event.path = '/api/'
  } else if (event.path.includes('/swagger-ui')) {
    event.path = event.path.replace('/swagger-ui', '/api/swagger-ui')
  }
  const app = await bootstrapServer()
  const handler = serverlessExpress({ app })
  return handler(event, context, callback)
}
