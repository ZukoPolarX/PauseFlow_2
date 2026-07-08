import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

// Punto de entrada de la aplicación Flutter.
void main() {
  runApp(const PauseFlowApp());
}

// Widget principal que define el tema y la pantalla inicial.
class PauseFlowApp extends StatelessWidget {
  const PauseFlowApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'PauseFlow',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.teal),
        useMaterial3: true,
      ),
      home: const HomeScreen(),
    );
  }
}

// Pantalla principal con el formulario de configuración.
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

// Estado de la pantalla principal donde se guardan los valores del formulario.
class _HomeScreenState extends State<HomeScreen> {
  final _formKey = GlobalKey<FormState>();
  final _fullNameController = TextEditingController(text: 'Ana García');
  final _emailController = TextEditingController(text: 'ana@example.com');
  final _phoneController = TextEditingController(text: '5551234567');
  final _passwordController = TextEditingController(text: 'secreta123');

  int hydrationGoal = 8;
  int breakInterval = 45;
  int hydrationReminder = 20;
  int stretchReminder = 10;
  bool _isLoading = false;
  String _message = '';

  // Dirección base del backend para enviar los datos.
  static const String backendUrl = 'http://localhost:3000';

  // Enviar los datos del formulario al backend.
  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _message = '';
    });

    // Crear el cuerpo de la petición con los datos del usuario.
    final payload = {
      'fullName': _fullNameController.text,
      'email': _emailController.text,
      'phone': _phoneController.text,
      'hydrationGoal': hydrationGoal,
      'breakInterval': breakInterval,
      'hydrationReminder': hydrationReminder,
      'stretchReminder': stretchReminder,
      'password': _passwordController.text,
    };

    try {
      // Enviar POST al endpoint /api/users.
      final response = await http.post(
        Uri.parse('$backendUrl/api/users'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(payload),
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        setState(() {
          _message = 'Configuración guardada correctamente en PostgreSQL';
        });
      } else {
        setState(() {
          _message = 'Error al guardar: ${response.body}';
        });
      }
    } catch (e) {
      setState(() {
        _message = 'No fue posible conectar con el backend: $e';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final summaryCards = [
      {'label': 'Descanso', 'value': '$breakInterval min'},
      {'label': 'Hidratación', 'value': '$hydrationGoal vasos'},
      {'label': 'Estiramiento', 'value': '$stretchReminder min'},
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('PauseFlow'),
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Descanso, hidratación y estiramiento inteligentes',
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              const Text(
                'Configura tus recordatorios y guarda tus datos de forma segura.',
                style: TextStyle(fontSize: 15, color: Colors.black54),
              ),
              const SizedBox(height: 16),
              const Text('Resumen de pausa', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: summaryCards.map((item) {
                  return SizedBox(
                    width: 150,
                    child: Card(
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(item['label']!, style: const TextStyle(fontWeight: FontWeight.w600)),
                            const SizedBox(height: 4),
                            Text(item['value']!),
                          ],
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 20),
              TextFormField(
                controller: _fullNameController,
                decoration: const InputDecoration(labelText: 'Nombre completo'),
                validator: (value) => value == null || value.isEmpty ? 'Requerido' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(labelText: 'Correo electrónico'),
                validator: (value) => value == null || value.isEmpty ? 'Requerido' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _phoneController,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(labelText: 'Teléfono'),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _passwordController,
                obscureText: true,
                decoration: const InputDecoration(labelText: 'Contraseña'),
                validator: (value) => value == null || value.isEmpty ? 'Requerido' : null,
              ),
              const SizedBox(height: 20),
              const Text('Intervalo de descanso (minutos)'),
              Slider(
                value: breakInterval.toDouble(),
                min: 15,
                max: 90,
                divisions: 15,
                label: '$breakInterval min',
                onChanged: (value) => setState(() => breakInterval = value.round()),
              ),
              const SizedBox(height: 12),
              const Text('Meta de hidratación (vasos)'),
              Slider(
                value: hydrationGoal.toDouble(),
                min: 4,
                max: 12,
                divisions: 8,
                label: '$hydrationGoal vasos',
                onChanged: (value) => setState(() => hydrationGoal = value.round()),
              ),
              const SizedBox(height: 12),
              const Text('Recordatorio de hidratación (minutos)'),
              Slider(
                value: hydrationReminder.toDouble(),
                min: 10,
                max: 60,
                divisions: 10,
                label: '$hydrationReminder min',
                onChanged: (value) => setState(() => hydrationReminder = value.round()),
              ),
              const SizedBox(height: 12),
              const Text('Recordatorio de estiramiento (minutos)'),
              Slider(
                value: stretchReminder.toDouble(),
                min: 5,
                max: 30,
                divisions: 5,
                label: '$stretchReminder min',
                onChanged: (value) => setState(() => stretchReminder = value.round()),
              ),
              const SizedBox(height: 24),
              // Botón para guardar la configuración en el backend.
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _isLoading ? null : _submit,
                  icon: _isLoading
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.save),
                  label: Text(_isLoading ? 'Guardando...' : 'Guardar configuración'),
                ),
              ),
              const SizedBox(height: 16),
              // Mostrar mensajes de éxito o error tras intentar guardar.
              if (_message.isNotEmpty)
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.teal.shade50,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(_message),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
