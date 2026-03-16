import { existsSync } from 'fs'
import { readFile, writeFile } from 'fs/promises'
import { IStickerConfig, IStickerOptions } from './Types'
import Utils, { defaultBg } from './Utils'
import convert from './internal/convert'
import Exif from './internal/Metadata/Exif'
import { StickerTypes } from './internal/Metadata/StickerTypes'
import { Categories, extractMetadata } from '.'
import { Color } from 'sharp'
import { fileTypeFromBuffer } from 'file-type'

export class Sticker {
    constructor(private data: string | Buffer, public metadata: Partial<IStickerOptions> = {}) {
        this.metadata.author = this.metadata.author ?? ''
        this.metadata.pack = this.metadata.pack ?? ''
        this.metadata.id = this.metadata.id ?? Utils.generateStickerID()
        this.metadata.quality = this.metadata.quality ?? 100
        this.metadata.type = Object.values(StickerTypes).includes(this.metadata.type as StickerTypes)
            ? this.metadata.type
            : StickerTypes.DEFAULT
        this.metadata.background = this.metadata.background ?? defaultBg
    }

    private _parse = async (): Promise<Buffer> => {
        if (Buffer.isBuffer(this.data)) return this.data
        if (this.data.trim().startsWith('<svg')) return Buffer.from(this.data)
        if (existsSync(this.data)) return readFile(this.data)
        const res = await fetch(this.data as string)
        if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`)
        return Buffer.from(await res.arrayBuffer())
    }

    private _getMimeType = async (data: Buffer): Promise<string> => {
        const type = await fileTypeFromBuffer(data)
        if (!type) {
            if (typeof this.data === 'string') return 'image/svg+xml'
            throw new Error('Invalid file type')
        }
        return type.mime
    }

    public build = async (): Promise<Buffer> => {
        const data = await this._parse()
        const mime = await this._getMimeType(data)
        return new Exif(this.metadata as IStickerConfig).add(await convert(data, mime, this.metadata))
    }

    public toBuffer = this.build

    public get defaultFilename(): string {
        return `./${this.metadata.pack}-${this.metadata.author}.webp`
    }

    public toFile = async (filename = this.defaultFilename): Promise<string> => {
        await writeFile(filename, await this.build())
        return filename
    }

    public setPack = (pack: string): this => {
        this.metadata.pack = pack
        return this
    }

    public setAuthor = (author: string): this => {
        this.metadata.author = author
        return this
    }

    public setID = (id: string): this => {
        this.metadata.id = id
        return this
    }

    public setCategories = (categories: Categories[]): this => {
        this.metadata.categories = categories
        return this
    }

    public setType = (type: StickerTypes | string): this => {
        this.metadata.type = type
        return this
    }

    public setQuality = (quality: number): this => {
        this.metadata.quality = quality
        return this
    }

    public setBackground = (background: Color): this => {
        this.metadata.background = background
        return this
    }

    /** @deprecated Use `.build()` instead */
    public get = this.build

    public toMessage = async (): Promise<{ sticker: Buffer }> => ({ sticker: await this.build() })

    public static extractMetadata = extractMetadata
}

export const createSticker = async (...args: ConstructorParameters<typeof Sticker>): Promise<Buffer> =>
    new Sticker(...args).build()
