targetScope = 'resourceGroup'

@description('Azure Static Web Appsのグローバルに一意なリソース名。')
param staticWebAppName string

@description('Azure Static Web Appsを作成するリージョン。')
param location string

@description('用途と管理元を識別するリソースタグ。')
param tags object

// SWAを初回作成する場合だけ使用する。既存環境へのStorage追加ではmain.bicepから参照する。
resource staticWebApp 'Microsoft.Web/staticSites@2025-03-01' = {
  name: staticWebAppName
  location: location
  tags: tags
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    buildProperties: {
      skipGithubActionWorkflowGeneration: true
    }
  }
}

@description('作成したAzure Static Web Appsの既定ホスト名。')
output defaultHostname string = staticWebApp.properties.defaultHostname
