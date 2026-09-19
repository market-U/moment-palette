using '../main.bicep'

param staticWebAppName = 'moment-palette-fs-market-u-20260918'
param location = 'eastasia'
param tags = {
  project: 'moment-palette'
  environment: 'fs'
  'managed-by': 'bicep'
}
