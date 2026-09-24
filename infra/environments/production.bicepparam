using '../main.bicep'

// resource名のfsは既存実体の履歴であり、現行用途は初期Production環境である。
param staticWebAppName = 'moment-palette-fs-market-u-20260918'
param storageAccountName = 'mpfsmarketu20260921'
param templateContainerName = 'moment-palette-templates'
param location = 'eastasia'
param tags = {
  project: 'moment-palette'
  environment: 'production'
  'managed-by': 'bicep'
}
