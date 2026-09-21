targetScope = 'resourceGroup'

@description('F/S用Azure Static Web Appsのグローバルに一意なリソース名。')
param staticWebAppName string

@description('Azure Static Web Appsを作成するリージョン。')
param location string

@description('F/S用途と管理元を識別するリソースタグ。')
param tags object

@description('F/S用テンプレートを保存するグローバルに一意なStorage Account名。')
@minLength(3)
@maxLength(24)
param storageAccountName string

@description('非公開テンプレートを保存するBlob container名。')
param templateContainerName string = 'moment-palette-templates'

// 既存SWAのGitHub連携をStorage追加時のPUTで変更しないよう、参照だけに限定する。
resource staticWebApp 'Microsoft.Web/staticSites@2025-03-01' existing = {
  name: staticWebAppName
}

resource storageAccount 'Microsoft.Storage/storageAccounts@2025-06-01' = {
  name: storageAccountName
  location: location
  tags: tags
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    allowBlobPublicAccess: false
    allowSharedKeyAccess: true
    minimumTlsVersion: 'TLS1_2'
    publicNetworkAccess: 'Enabled'
    supportsHttpsTrafficOnly: true
  }
}

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2025-06-01' = {
  parent: storageAccount
  name: 'default'
  properties: {
    cors: {
      corsRules: [
        {
          allowedHeaders: ['*']
          allowedMethods: [
            'GET'
            'HEAD'
            'OPTIONS'
          ]
          allowedOrigins: ['*']
          exposedHeaders: ['*']
          maxAgeInSeconds: 3600
        }
      ]
    }
    deleteRetentionPolicy: {
      allowPermanentDelete: false
      days: 14
      enabled: true
    }
    containerDeleteRetentionPolicy: {
      days: 14
      enabled: true
    }
    isVersioningEnabled: true
  }
}

resource templateContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2025-06-01' = {
  parent: blobService
  name: templateContainerName
  properties: {
    // Azureが作成時に設定する既定値も宣言し、what-ifで削除差分として扱われないようにする。
    defaultEncryptionScope: '$account-encryption-key'
    denyEncryptionScopeOverride: false
    publicAccess: 'None'
  }
}

@description('作成したF/S用Azure Static Web Appsの既定ホスト名。')
output defaultHostname string = staticWebApp.properties.defaultHostname

@description('秘密値を含まないF/S用Storage Account名。')
output deployedStorageAccountName string = storageAccount.name

@description('秘密値を含まないprivate Blob container名。')
output deployedTemplateContainerName string = templateContainer.name
