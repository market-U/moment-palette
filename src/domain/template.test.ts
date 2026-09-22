import { describe, expect, it } from 'vitest'

import { createInitialArtwork, createTemplate } from './template'

const input = () => ({
  id: 'buncho-01',
  assetRevision: 'r1',
  name: { ja: '文鳥', en: 'Java sparrow' },
  tags: ['bird'],
  areas: [
    {
      id: 'background',
      label: { ja: '背景', en: 'Background' },
      initialColor: '#F3EBDD',
    },
  ],
})

describe('template domain', () => {
  it('area順を維持した初期作品を生成する', () => {
    const template = createTemplate({
      ...input(),
      areas: [
        ...input().areas,
        {
          id: 'body',
          label: { ja: '体', en: 'Body' },
          initialColor: '#E8DED2',
        },
      ],
    })

    expect(createInitialArtwork(template)).toEqual({
      templateId: 'buncho-01',
      templateRevision: 'r1',
      areas: [
        {
          areaId: 'background',
          fill: { kind: 'initial', color: '#F3EBDD' },
        },
        { areaId: 'body', fill: { kind: 'initial', color: '#E8DED2' } },
      ],
    })
  })

  it('空のareaを拒否する', () => {
    expect(() => createTemplate({ ...input(), areas: [] })).toThrow(
      /1件以上のarea/,
    )
  })

  it('重複area IDを拒否する', () => {
    expect(() =>
      createTemplate({
        ...input(),
        areas: [...input().areas, ...input().areas],
      }),
    ).toThrow(/重複/)
  })

  it('不透明な大文字#RRGGBB以外の初期色を拒否する', () => {
    expect(() =>
      createTemplate({
        ...input(),
        areas: [{ ...input().areas[0]!, initialColor: '#fff' }],
      }),
    ).toThrow(/#RRGGBB/)
  })
})
