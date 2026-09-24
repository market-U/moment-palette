import { describe, expect, it } from 'vitest'

import {
  applyCameraFill,
  applyPhotoFill,
  applySolidColorFill,
  createInitialArtwork,
  createTemplate,
} from './template'

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

  it('指定areaだけをcamera fillへ更新し、元の作品を変更しない', () => {
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
    const initial = createInitialArtwork(template)

    const updated = applyCameraFill(initial, 'body')

    expect(updated.areas).toEqual([
      {
        areaId: 'background',
        fill: { kind: 'initial', color: '#F3EBDD' },
      },
      { areaId: 'body', fill: { kind: 'camera' } },
    ])
    expect(initial.areas[1]?.fill).toEqual({
      kind: 'initial',
      color: '#E8DED2',
    })
  })

  it('存在しないareaへのcamera fillを拒否する', () => {
    const artwork = createInitialArtwork(createTemplate(input()))

    expect(() => applyCameraFill(artwork, 'missing')).toThrow(/存在しないarea/)
  })

  it('指定areaだけをphoto fillへ更新し、既存fillを上書きする', () => {
    const artwork = applyCameraFill(
      createInitialArtwork(createTemplate(input())),
      'background',
    )

    expect(applyPhotoFill(artwork, 'background').areas).toEqual([
      { areaId: 'background', fill: { kind: 'photo' } },
    ])
    expect(artwork.areas[0]?.fill).toEqual({ kind: 'camera' })
  })

  it('指定areaだけを大文字の単色fillへ更新し、既存fillを上書きする', () => {
    const artwork = applyPhotoFill(
      createInitialArtwork(createTemplate(input())),
      'background',
    )

    expect(applySolidColorFill(artwork, 'background', '#b35f91').areas).toEqual(
      [{ areaId: 'background', fill: { kind: 'solid', color: '#B35F91' } }],
    )
    expect(artwork.areas[0]?.fill).toEqual({ kind: 'photo' })
  })

  it('不透明な#RRGGBB以外の単色と存在しないareaを拒否する', () => {
    const artwork = createInitialArtwork(createTemplate(input()))

    expect(() => applySolidColorFill(artwork, 'background', '#fff')).toThrow(
      /#RRGGBB/,
    )
    expect(() => applySolidColorFill(artwork, 'missing', '#FFFFFF')).toThrow(
      /存在しないarea/,
    )
  })
})
