import { exec } from 'child_process'
import { readFile, unlink } from 'fs/promises'
import { tmpdir } from 'os'
import { promisify } from 'util'

const execAsync = promisify(exec)

const crop = async (filename: string): Promise<Buffer> => {
    const output = `${tmpdir()}/${Math.random().toString(36)}.webp`

    try {
        await execAsync(
            `ffmpeg -i "${filename}" -vcodec libwebp -vf "crop=w='min(min(iw,ih),500)':h='min(min(iw,ih),500)',scale=500:500,setsar=1,fps=15" -loop 0 -preset default -an -vsync 0 -s 512:512 "${output}"`
        )
        return await readFile(output)
    } finally {
        await Promise.allSettled([unlink(output)])
    }
}

export default crop
