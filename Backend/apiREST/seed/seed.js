import 'dotenv/config';
import { Sequelize, DataTypes } from 'sequelize';
import faker from 'faker';
import mysql12 from 'mysql2/promise';
// Configuración de la base de datos
const connection = await mysql12.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});
// Crear Base de datos segun DB_NAME
await connection.query(`DROP DATABASE IF EXISTS ${process.env.DB_NAME}`);
await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
await connection.end();

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
});
// Modelo de Productos
const Producto = sequelize.define('Producto', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nombre: { type: DataTypes.STRING, allowNull: false },
    descripcion: { type: DataTypes.TEXT },
    precio: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    cantidad_stock: { type: DataTypes.INTEGER, allowNull: false }
}, { indexes: [{ fields: ['nombre'] }] });

// Modelo de Compradores
const Comprador = sequelize.define('Comprador', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    tipo_id: { type: DataTypes.STRING(10), allowNull: false },
    nombres: { type: DataTypes.STRING, allowNull: false },
    apellidos: { type: DataTypes.STRING, allowNull: false },
    fecha_creacion: { type: DataTypes.DATE, defaultValue: Sequelize.NOW }
}, { indexes: [{ fields: ['tipo_id', 'id'] }] });

// Modelo de Transacciones
const Transaccion = sequelize.define('Transaccion', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    comprador_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: Comprador, key: 'id' } },
    producto_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: Producto, key: 'id' } },
    precio_pagado: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    impuesto: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    fecha: { type: DataTypes.DATE, defaultValue: Sequelize.NOW }
}, { indexes: [{ fields: ['comprador_id', 'producto_id'] }] });

// Modelo de Eventos del Comprador
const EventoComprador = sequelize.define('EventoComprador', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    comprador_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: Comprador, key: 'id' } },
    tipo_evento: { type: DataTypes.ENUM('compra', 'devolucion', 'visita', 'consulta', 'actualizacion', 'descarga_factura'), allowNull: false },
    fecha: { type: DataTypes.DATE, defaultValue: Sequelize.NOW }
}, { indexes: [{ fields: ['comprador_id', 'tipo_evento'] }] });

// Sincronizar modelos con la base de datos y llenar con datos dummy
async function seedDatabase() {
    try {
        await sequelize.authenticate();
        console.log('Conexión establecida con éxito.');
        await sequelize.sync({ force: true });
        console.log('Base de datos sincronizada.');

        // Insertar productos
        const productos = [];
        for (let i = 0; i < 10000; i++) {
            productos.push({
                nombre: faker.commerce.productName(),
                descripcion: faker.commerce.productDescription(),
                precio: faker.commerce.price(),
                cantidad_stock: faker.datatype.number({ min: 1, max: 100 })
            });
        }
        await Producto.bulkCreate(productos);

        // Insertar compradores
        const compradores = [];
        for (let i = 0; i < 10000; i++) {
            compradores.push({
                tipo_id: faker.random.arrayElement(['DNI', 'PASAPORTE', 'RFC']),
                nombres: faker.name.firstName(),
                apellidos: faker.name.lastName(),
                fecha_creacion: faker.date.past()
            });
        }
        await Comprador.bulkCreate(compradores);

        // Insertar transacciones
        const transacciones = [];
        for (let i = 0; i < 10000; i++) {
            transacciones.push({
                comprador_id: faker.datatype.number({ min: 1, max: 2500 }),
                producto_id: faker.datatype.number({ min: 1, max: 2500 }),
                precio_pagado: faker.commerce.price(),
                impuesto: faker.datatype.float({ min: 1, max: 20 }),
                fecha: faker.date.recent()
            });
        }
        await Transaccion.bulkCreate(transacciones);

        // Insertar eventos de comprador
        const eventos = [];
        for (let i = 0; i < 10000; i++) {
            eventos.push({
                comprador_id: faker.datatype.number({ min: 1, max: 2500 }),
                tipo_evento: faker.random.arrayElement(['compra', 'devolucion', 'visita', 'consulta', 'actualizacion', 'descarga_factura']),
                fecha: faker.date.recent()
            });
        }
        await EventoComprador.bulkCreate(eventos);

        console.log('Datos insertados exitosamente.');
    } catch (error) {
        console.error('Error al insertar datos:', error);
    } finally {
        await sequelize.close();
    }
}

seedDatabase();
