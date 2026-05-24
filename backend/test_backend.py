import os
import sys
from fastapi.testclient import TestClient

# Asegurar que el directorio local del backend esté en el PATH de Python
sys.path.append(os.path.dirname(__file__))

from main import app

client = TestClient(app)

def test_chat_webhook():
    print("\n[Bella Studio Backend] Iniciando pruebas en /api/webhook/chat...")
    
    # Realizar petición POST de prueba a FastAPI
    response = client.post(
        "/api/webhook/chat",
        json={
            "message": "Hola, ¿tienen citas para uñas acrílicas hoy?",
            "user_id": "usuario_cliente_prueba"
        }
    )
    
    # Imprimir logs de resultados
    print(f" -> Codigo de Estado HTTP: {response.status_code}")
    print(f" -> Cuerpo de Respuesta: {response.json()}")
    
    # Validaciones y Aserciones
    assert response.status_code == 200, f"Se esperaba código 200 pero se obtuvo {response.status_code}"
    data = response.json()
    assert "reply" in data, "La respuesta debe contener la llave 'reply'"
    assert "Recibí tu mensaje" in data["reply"], "El formato de respuesta base es inválido"
    
    print("\n[SUCCESS]: ¡Las pruebas de enrutamiento y servicio del backend pasaron al 100%!")

if __name__ == "__main__":
    try:
        test_chat_webhook()
    except AssertionError as err:
        print(f"\n[ERROR]: Las pruebas fallaron. {err}")
        sys.exit(1)
    except Exception as err:
        print(f"\n[ERROR]: Ocurrió un error inesperado: {err}")
        sys.exit(1)
