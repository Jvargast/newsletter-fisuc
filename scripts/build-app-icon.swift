import AppKit
import Foundation

let fileManager = FileManager.default
let rootPath = CommandLine.arguments.dropFirst().first ?? "."
let rootURL = URL(fileURLWithPath: rootPath).standardizedFileURL
let sourceURL = rootURL.appendingPathComponent("public/app.png")
let outputURL = rootURL.appendingPathComponent("build/app-rounded.png")

guard let sourceImage = NSImage(contentsOf: sourceURL) else {
  fputs("No se pudo abrir la imagen base en \(sourceURL.path)\n", stderr)
  exit(1)
}

let sourceSize = sourceImage.size
let shortestSide = min(sourceSize.width, sourceSize.height)
let cropInset = shortestSide * 0.076
let cropSize = shortestSide - (cropInset * 2)
let cropRect = NSRect(
  x: (sourceSize.width - cropSize) / 2,
  y: (sourceSize.height - cropSize) / 2,
  width: cropSize,
  height: cropSize
)

let canvasSide: CGFloat = 1024
let iconInset: CGFloat = 40
let cornerRadius: CGFloat = 220
let targetRect = NSRect(
  x: iconInset,
  y: iconInset,
  width: canvasSide - (iconInset * 2),
  height: canvasSide - (iconInset * 2)
)

guard let bitmap = NSBitmapImageRep(
  bitmapDataPlanes: nil,
  pixelsWide: Int(canvasSide),
  pixelsHigh: Int(canvasSide),
  bitsPerSample: 8,
  samplesPerPixel: 4,
  hasAlpha: true,
  isPlanar: false,
  colorSpaceName: .deviceRGB,
  bytesPerRow: 0,
  bitsPerPixel: 0
) else {
  fputs("No se pudo crear el bitmap para el icono.\n", stderr)
  exit(1)
}

bitmap.size = NSSize(width: canvasSide, height: canvasSide)

NSGraphicsContext.saveGraphicsState()
guard let graphicsContext = NSGraphicsContext(bitmapImageRep: bitmap) else {
  fputs("No se pudo crear el contexto gráfico.\n", stderr)
  exit(1)
}

NSGraphicsContext.current = graphicsContext
graphicsContext.imageInterpolation = .high
graphicsContext.cgContext.clear(CGRect(x: 0, y: 0, width: canvasSide, height: canvasSide))

let clipPath = NSBezierPath(roundedRect: targetRect, xRadius: cornerRadius, yRadius: cornerRadius)
clipPath.addClip()

sourceImage.draw(
  in: targetRect,
  from: cropRect,
  operation: NSCompositingOperation.copy,
  fraction: 1
)

NSGraphicsContext.restoreGraphicsState()

guard let pngData = bitmap.representation(using: .png, properties: [:]) else {
  fputs("No se pudo exportar el icono intermedio en PNG.\n", stderr)
  exit(1)
}

try fileManager.createDirectory(
  at: outputURL.deletingLastPathComponent(),
  withIntermediateDirectories: true
)

try pngData.write(to: outputURL, options: .atomic)
print(outputURL.path)
