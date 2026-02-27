import { exec } from 'child_process'
import { readFile, unlink } from 'fs/promises'
import { tmpdir } from 'os'
import { promisify } from 'util'

const execAsync = promisify(exec)

const imagesToWebp = async (filename: string): Promise<Buffer> => {
    const output = `${tmpdir()}/${Math.random().toString(36)}.webp`

    try {
        await execAsync(
            `ffmpeg -i "${filename}" -lavfi "split[v],palettegen,[v]paletteuse" -vcodec libwebp -r 10 -loop 0 "${output}"`
        )
        return await readFile(output)
    } finally {
        await Promise.allSettled([unlink(output)])
    }
}

export default imagesToWebp
