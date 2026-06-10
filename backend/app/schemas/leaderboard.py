from pydantic import BaseModel


class LeaderboardEntry(BaseModel):
    posicion: int
    usuario_id: int
    nombre: str
    puntos_total: int
    aciertos_exactos: int
    predicciones_evaluadas: int
