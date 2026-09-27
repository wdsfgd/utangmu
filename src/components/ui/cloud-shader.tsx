import React, { useEffect, useRef, useState } from 'react'

export function CloudShader({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Deteksi perangkat mobile/layar sempit untuk menonaktifkan WebGL berat
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || (navigator.maxTouchPoints > 1 && window.innerWidth < 1024))
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (isMobile) return
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext('webgl', { powerPreference: 'low-power', alpha: true })
    if (!gl) return

    const vsSource = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `

    const fsSource = `
      precision mediump float;
      uniform vec2 u_resolution;
      uniform float u_time;

      float random(in vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
      }

      float noise(in vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);

        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));

        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }

      float fbm(in vec2 st) {
        float value = 0.0;
        float amplitude = 0.5;
        for (int i = 0; i < 3; i++) {
          value += amplitude * noise(st);
          st *= 2.0;
          amplitude *= 0.5;
        }
        return value;
      }

      void main() {
        vec2 st = gl_FragCoord.xy / u_resolution.xy;
        st.x *= u_resolution.x / u_resolution.y;

        vec2 q = vec2(0.0);
        q.x = fbm(st + 0.05 * u_time);
        q.y = fbm(st + vec2(1.0));

        vec2 r = vec2(0.0);
        r.x = fbm(st + 1.0 * q + vec2(1.7, 9.2) + 0.15 * u_time);
        r.y = fbm(st + 1.0 * q + vec2(8.3, 2.8) + 0.126 * u_time);

        float f = fbm(st + r);

        vec3 color1 = vec3(0.02, 0.04, 0.06);
        vec3 color2 = vec3(0.06, 0.40, 0.28);
        vec3 color3 = vec3(0.05, 0.25, 0.45);
        vec3 color4 = vec3(0.15, 0.08, 0.30);

        vec3 col = mix(color1, color2, clamp((f * f) * 4.0, 0.0, 1.0));
        col = mix(col, color3, clamp(length(q), 0.0, 1.0));
        col = mix(col, color4, clamp(length(r.x), 0.0, 1.0));

        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        float vignette = uv.x * uv.y * (1.0 - uv.x) * (1.0 - uv.y);
        vignette = clamp(pow(16.0 * vignette, 0.4), 0.0, 1.0);

        gl_FragColor = vec4(col * vignette * 0.85, 1.0);
      }
    `

    function createShader(glCtx: WebGLRenderingContext, type: number, source: string) {
      const shader = glCtx.createShader(type)
      if (!shader) return null
      glCtx.shaderSource(shader, source)
      glCtx.compileShader(shader)
      if (!glCtx.getShaderParameter(shader, glCtx.COMPILE_STATUS)) {
        glCtx.deleteShader(shader)
        return null
      }
      return shader
    }

    const vs = createShader(gl, gl.VERTEX_SHADER, vsSource)
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource)
    if (!vs || !fs) return

    const program = gl.createProgram()
    if (!program) return
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      return
    }

    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1.0, -1.0,
         1.0, -1.0,
        -1.0,  1.0,
        -1.0,  1.0,
         1.0, -1.0,
         1.0,  1.0,
      ]),
      gl.STATIC_DRAW
    )

    const posAttr = gl.getAttribLocation(program, 'position')
    const resUniform = gl.getUniformLocation(program, 'u_resolution')
    const timeUniform = gl.getUniformLocation(program, 'u_time')

    let animId: number
    const startTime = performance.now()

    const handleResize = () => {
      if (!canvas) return
      // Downsampling canvas internal ke 384x216 untuk performa 60 FPS tinggi dan hemat GPU
      const targetW = 384
      const targetH = 216
      canvas.width = targetW
      canvas.height = targetH
      gl.viewport(0, 0, canvas.width, canvas.height)
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    let isVisible = true
    const handleVisibility = () => {
      isVisible = !document.hidden
    }
    document.addEventListener('visibilitychange', handleVisibility)

    const render = (now: number) => {
      if (isVisible) {
        gl.useProgram(program)
        gl.enableVertexAttribArray(posAttr)
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
        gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0)

        gl.uniform2f(resUniform, canvas.width, canvas.height)
        gl.uniform1f(timeUniform, (now - startTime) * 0.0003)

        gl.drawArrays(gl.TRIANGLES, 0, 6)
      }
      animId = requestAnimationFrame(render)
    }

    animId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [isMobile])

  if (isMobile) {
    return (
      <div
        className={`pointer-events-none absolute inset-0 h-full w-full bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(16,185,129,0.18),transparent_75%)] opacity-70 ${className}`}
      />
    )
  }

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 h-full w-full opacity-60 mix-blend-screen ${className}`}
    />
  )
}
