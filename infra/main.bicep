targetScope = 'resourceGroup'

@description('F/S用Azure Static Web Appsのグローバルに一意なリソース名。')
param staticWebAppName string

@description('Azure Static Web Appsを作成するリージョン。')
param location string

@description('F/S用途と管理元を識別するリソースタグ。')
param tags object

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

@description('作成したF/S用Azure Static Web Appsの既定ホスト名。')
output defaultHostname string = staticWebApp.properties.defaultHostname
