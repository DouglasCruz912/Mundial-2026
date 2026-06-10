---
name: stack-security-audit
description: Security audit of the Mundial-2026 stack against OWASP API Security Top 10 (FastAPI backend) and frontend security (React XSS, VITE_ secrets, token storage). Use when the user asks to audit security, review changes for vulnerabilities, or check the stack before shipping.
---

# stack-security-audit

Auditoría de seguridad del stack de Mundial-2026. Revisa el código (o el diff) de backend y/o frontend contra los controles documentados en [../../../CLAUDE.md](../../../CLAUDE.md), [backend/CLAUDE.md](../../../backend/CLAUDE.md) y [frontend/CLAUDE.md](../../../frontend/CLAUDE.md), basados en OWASP API Security Top 10 (2023).

## Alcance
- Si hay diff/cambios pendientes, audita esos archivos primero.
- Si el usuario indica un área (back/front/feature), céntrate ahí.
- Reporta hallazgos con **severidad** (Crítica/Alta/Media/Baja), `archivo:línea`, la **regla violada** (citando el CLAUDE.md correspondiente) y la **corrección sugerida**. No marques como seguro lo que no verificaste.

## Checklist Backend (FastAPI / OWASP API Top 10)

- [ ] **API1 BOLA/IDOR:** cada acceso a recurso de usuario (`Prediccion`, `Participacion`, `Quiniela`) verifica ownership contra el usuario autenticado. No se confía en IDs del path/body para autorizar.
- [ ] **API2 Auth:** contraseñas con Argon2/bcrypt (nunca texto plano); JWT con `exp` validado; `SECRET_KEY` desde entorno; 401 genérico anti-enumeración.
- [ ] **API3 BOPLA / fuga de datos:** todo endpoint declara `response_model` que excluye campos sensibles (`hashed_password`, etc.). No se devuelve el modelo ORM crudo.
- [ ] **API4 Consumo ilimitado:** listados con paginación (`Query(..., le=100)`); rate limiting en login/endpoints sensibles.
- [ ] **API5 Function-level auth:** scopes correctos con `Security(..., scopes=[...])`; rutas de admin protegidas.
- [ ] **API7 SSRF:** URLs externas suministradas por el usuario validadas/allow-list antes de llamarlas.
- [ ] **API8 Misconfig:** sin secretos hardcodeados/commiteados; `.env` en `.gitignore`; **CORS sin `*` con `allow_credentials=True`**; `DEBUG` apagado en prod.
- [ ] **API9 Inventory:** API versionada (`/api/v1`); OpenAPI documentada.
- [ ] **Errores:** sin stack traces ni errores de DB hacia el cliente; handler global con mensaje seguro.
- [ ] **Inyección:** consultas vía SQLAlchemy/ORM parametrizadas; sin SQL string-concatenado.

## Checklist Frontend (React)

- [ ] **Secretos:** ninguna clave/credencial en `import.meta.env.VITE_*` (es público, va al bundle). Solo URLs públicas/flags.
- [ ] **XSS:** sin `dangerouslySetInnerHTML`, o solo con HTML sanitizado (DOMPurify) y justificado.
- [ ] **Tokens:** almacenamiento adecuado (preferible cookie `httpOnly`); si `localStorage`, riesgo XSS asumido y minimizado.
- [ ] **Validación:** la validación del cliente es UX; existe revalidación equivalente en el backend.
- [ ] **Exposición de datos:** no se piden/renderizan datos de quinielas/usuarios ajenos (la autorización real es del backend).
- [ ] **Dependencias:** sin paquetes con vulnerabilidades conocidas (revisar `npm audit` si aplica).

## Transversal
- [ ] `.gitignore` cubre `.env`, secretos, `node_modules/`, `dist/`, `.venv/`, `__pycache__/`.
- [ ] No hay secretos en el historial de git ni en archivos versionados.
- [ ] Contrato back↔front coherente (mismas validaciones en Zod y Pydantic).

## Formato del reporte
```
## Hallazgos de seguridad

### [CRÍTICA] CORS permite cualquier origen con credenciales
- Archivo: backend/app/main.py:24
- Regla: backend/CLAUDE.md → CORS (jamás `*` con allow_credentials=True)
- Corrección: usar settings.allowed_origins (lista explícita).

### [ALTA] Falta verificación de ownership en GET /predicciones/{id}
...
```
Termina con un resumen: nº de hallazgos por severidad y si es seguro continuar.
