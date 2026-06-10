import pytest

from app.services.puntuacion_service import calcular_puntos


@pytest.mark.parametrize(
    ("pred", "real", "esperado"),
    [
        # Marcador exacto = 3
        ((2, 1), (2, 1), 3),
        ((0, 0), (0, 0), 3),
        ((0, 3), (0, 3), 3),
        # Resultado correcto (G/E/P) sin exacto = 1
        ((1, 0), (3, 1), 1),   # gana local en ambos
        ((0, 1), (1, 4), 1),   # gana visitante en ambos
        ((1, 1), (2, 2), 1),   # empate en ambos
        # Fallo = 0
        ((2, 1), (1, 2), 0),   # predijo local, ganó visitante
        ((1, 1), (2, 0), 0),   # predijo empate, ganó local
        ((0, 2), (0, 0), 0),   # predijo visitante, empate
        ((3, 0), (0, 3), 0),   # invertido
    ],
)
def test_calcular_puntos(pred: tuple, real: tuple, esperado: int):
    assert calcular_puntos(pred[0], pred[1], real[0], real[1]) == esperado
