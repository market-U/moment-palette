import { app, type HttpHandler, type HttpResponseInit } from '@azure/functions'

import { createAzureCatalogReader } from '../catalogReader'
import { readApiConfig } from '../config'
import { API_VERSION, BUILD_ID } from '../generated/buildMetadata'
import { createServiceSasSigner } from '../serviceSasSigner'
import { createTemplatesService } from '../templatesService'
import { PublicApiError } from '../types'

const noStoreHeaders = {
  'Cache-Control': 'no-store',
  'Content-Type': 'application/json; charset=utf-8',
}

const errorResponse = (error: unknown): HttpResponseInit => {
  const publicError =
    error instanceof PublicApiError
      ? error
      : new PublicApiError(
          'unexpected-error',
          'テンプレート一覧を取得できません。',
          500,
        )
  return {
    status: publicError.status,
    headers: noStoreHeaders,
    jsonBody: {
      error: { code: publicError.code, message: publicError.message },
    },
  }
}

/** `GET /api/templates`の公開可能なresponseまたは正規化済みerrorを返す。 */
export const templatesHandler: HttpHandler = async () => {
  try {
    const config = readApiConfig(process.env)
    const service = createTemplatesService({
      catalogReader: createAzureCatalogReader(config),
      sasSigner: createServiceSasSigner(config),
      now: () => new Date(),
      apiVersion: API_VERSION,
      buildId: BUILD_ID,
    })
    return {
      status: 200,
      headers: noStoreHeaders,
      jsonBody: await service.execute(),
    }
  } catch (error) {
    // 接続文字列やSDK例外を直接logせず、clientには固定した公開用errorだけを返す。
    return errorResponse(error)
  }
}

app.http('templates', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'templates',
  handler: templatesHandler,
})
