using '../main.bicep'

param staticWebAppName = 'moment-palette-fs-market-u-20260918'
param storageAccountName = 'mpfsmarketu20260921'
param templateContainerName = 'moment-palette-templates'
param location = 'eastasia'
param tags = {
  project: 'moment-palette'
  environment: 'fs'
  'managed-by': 'bicep'
}
