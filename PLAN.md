# VDSL — Plan de trabajo

## Fase 1: Que todo funcione (debugging)

1. Crear test unitario por componente — renderizar cada uno en aislamiento, capturar still, verificar que no sale negro
2. Arreglar mismatches de props entre compiler y componentes (QuoteBlock ya arreglado, quedan ~20)
3. Conseguir que showcase.vdsl renderice las 9 escenas correctamente
4. Test end-to-end: communication.vdsl (el de agentes) con componentes ricos

## Fase 2: Calidad visual (que sea bonito)

5. Revisar cada componente con ojos de diseñador — comparar con las visualizaciones de skillnet-docs
6. Mejorar los SVGs: gradientes, glows, sombras, profundidad
7. Añadir transiciones entre escenas (crossfade, slide, zoom) en el renderer
8. Probar con cobalt-grid y warm-editorial (no solo dark-tech)

## Fase 3: Producto (que sea usable)

9. MCP server (como UIDL) — tool `render_video(spec)` para Claude Code
10. Skill para Claude Code — agente genera .vdsl desde documentación
11. Mover repo a ubicación permanente
12. npm publish (o al menos documentar cómo instalar)
13. Temas custom por JSON (ya soportado, documentar mejor)

## Fase 4: Contenido (que sirva para algo)

14. Generar vídeo real de comunicación entre agentes con calidad
15. Generar vídeo para cada página de skillnet-docs
16. Template de tema SkillNet custom
