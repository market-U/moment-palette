import { rm } from 'node:fs/promises'
import { resolve } from 'node:path'

// API package直下の生成物だけを消し、過去buildのtest fileが配信物へ残ることを防ぐ。
await rm(resolve('dist'), { recursive: true, force: true })
