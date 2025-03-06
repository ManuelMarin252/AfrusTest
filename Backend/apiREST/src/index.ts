import express from 'express';
import 'dotenv/config';
import { Request, Response } from 'express';
import { Sequelize, DataTypes, Model, type Dialect } from 'sequelize';

const app = express();
const PORT = 3000;

// Configuración de la base de datos
const sequelize = new Sequelize(process.env.DB_Name, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    dialect: 'mysql',
    logging: false, // Desactiva logs en consola
});

app.use(express.json());

// Modelo de Productos
class Producto extends Model {
    public id!: number;
    public nombre!: string;
    public descripcion?: string;
    public precio!: number;
    public cantidad_stock!: number;
}

Producto.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nombre: { type: DataTypes.STRING, allowNull: false },
    descripcion: { type: DataTypes.TEXT },
    precio: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    cantidad_stock: { type: DataTypes.INTEGER, allowNull: false }
}, { sequelize, modelName: 'Producto', timestamps: false });

// Modelo de Eventos del Comprador
class EventoComprador extends Model {
    public id!: number;
    public comprador_id!: number;
    public tipo_evento!: string;
    public fecha!: Date;
}

EventoComprador.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    comprador_id: { type: DataTypes.INTEGER, allowNull: false },
    tipo_evento: { 
        type: DataTypes.ENUM('compra', 'devolucion', 'visita', 'consulta', 'actualizacion', 'descarga_factura'), 
        allowNull: false 
    },
    fecha: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { sequelize, modelName: 'EventoComprador', timestamps: false });


// Middleware para manejo de errores global
app.use((err: any, req: Request, res: Response, next: Function) => {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
});


// Obtener la lista completa de productos
app.get('/productos', async (req: Request, res: Response) => {
    try {
        const productos = await Producto.findAll();
        res.json(productos);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener productos' });
    }
});

// Crear un nuevo producto con validación
app.post('/productos', async (req: Request , res: Response) => {
    try {
        const { nombre, descripcion, precio, cantidad_stock } = req.body;
        if (!nombre || !precio || !cantidad_stock) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        const nuevoProducto = await Producto.create({ nombre, descripcion, precio, cantidad_stock });
        res.status(201).json(nuevoProducto);
    } catch (error) {
        res.status(500).json({ error: 'Error al crear el producto' });
    }
});

// Eliminar un producto
app.delete('/productos/:id', async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

        const producto = await Producto.findByPk(id);
        if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });

        await producto.destroy();
        res.json({ mensaje: 'Producto eliminado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el producto' });
    }
});

// Actualizar un producto
app.put('/productos/:id', async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

        const { nombre, descripcion, precio, cantidad_stock } = req.body;
        if (!nombre || !precio || !cantidad_stock) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        const producto = await Producto.findByPk(id);
        if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });

        await producto.update({ nombre, descripcion, precio, cantidad_stock });
        res.json(producto);
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar el producto' });
    }
});

// Obtener un producto por ID
app.get('/productos/:id', async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

        const producto = await Producto.findByPk(id);
        if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });

        res.json(producto);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el producto' });
    }
});

// Crear un evento del comprador con validación
app.post('/eventos-comprador', async (req: Request, res: Response) => {
    try {
        const { comprador_id, tipo_evento } = req.body;
        if (!comprador_id || !tipo_evento) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        const nuevoEvento = await EventoComprador.create({ comprador_id, tipo_evento });
        res.status(201).json(nuevoEvento);
    } catch (error) {
        res.status(500).json({ error: 'Error al crear el evento' });
    }
});

// Sincronizar la base de datos y arrancar el servidor
sequelize.sync().then(() => {
    app.listen(PORT, () => {
        console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
    });
}).catch(error => console.error('❌ Error al sincronizar la base de datos:', error));