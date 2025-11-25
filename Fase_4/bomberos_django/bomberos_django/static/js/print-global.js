// Sistema de impresión global para capturas de presentación
document.addEventListener('DOMContentLoaded', function() {
    console.log('[PRINT] Inicializando botón de impresión global');
    
    // Crear botón flotante
    const printButton = document.createElement('button');
    printButton.className = 'btn-print-global';
    printButton.innerHTML = '🖨️';
    printButton.title = 'Imprimir vista actual o guardar como PDF';
    printButton.onclick = imprimirVistaActual;
    
    // Agregar al body
    document.body.appendChild(printButton);
    
    console.log('[PRINT] ✅ Botón de impresión agregado');
});

function imprimirVistaActual() {
    console.log('[PRINT] Preparando impresión...');
    
    // Mensaje informativo
    const confirmar = confirm(
        '🖨️ IMPRIMIR VISTA ACTUAL\n\n' +
        '• Se abrirá el diálogo de impresión\n' +
        '• Puedes guardar como PDF\n' +
        '• El sidebar y botones se ocultarán automáticamente\n\n' +
        '¿Continuar?'
    );
    
    if (!confirmar) {
        console.log('[PRINT] Impresión cancelada por usuario');
        return;
    }
    
    // Preparar para impresión
    prepararParaImpresion();
    
    // Abrir diálogo de impresión
    setTimeout(() => {
        window.print();
        console.log('[PRINT] ✅ Diálogo de impresión abierto');
    }, 300);
}

function prepararParaImpresion() {
    // Agregar título a la página si no existe
    const pageTitle = document.querySelector('.page-header h2');
    if (pageTitle) {
        document.title = `SEIS - ${pageTitle.textContent}`;
    }
    
    // Expandir todas las tarjetas si están colapsadas
    const cards = document.querySelectorAll('.bombero-card');
    cards.forEach(card => {
        card.style.pageBreakInside = 'avoid';
    });
    
    console.log('[PRINT] Vista preparada para impresión');
}

// Atajos de teclado
document.addEventListener('keydown', function(e) {
    // Ctrl + P = Imprimir
    if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        imprimirVistaActual();
    }
    
    // Ctrl + Shift + P = Imprimir directo (sin confirmación)
    if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        prepararParaImpresion();
        setTimeout(() => window.print(), 300);
    }
});

console.log('[PRINT] ✅ Sistema de impresión global cargado');
console.log('[PRINT] 💡 Atajos: Ctrl+P (con confirmación) | Ctrl+Shift+P (directo)');
