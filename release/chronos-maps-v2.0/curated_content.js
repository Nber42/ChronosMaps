/**
 * CHRONOS CODEX - EXPERT CURATED STORIES
 * Tone: Divulgative, Rigorous, Amusing (AdAbsurdum/Antrophistoria style).
 */

const CURATED_POIS = [
    {
        coords: [40.4167, -3.7033], // Puerta del Sol, Madrid
        title: "Puerta del Sol: El 'Kilómetro Cero' y la Mariblanca",
        desc: "No siempre fue el centro. ¿Sabías que aquí hubo una iglesia con 'dragón' incluido?",
        text: `
            <h3>📍 El Verdadero Origen del Kilómetro Cero</h3>
            <p>Todo el mundo se hace la foto pisando la placa del Kilómetro Cero, pero pocos saben su historia 'mágica'. La Puerta del Sol no nació siendo el centro de Madrid; de hecho, era una entrada fortificada (de ahí lo de 'Puerta') orientada al naciente, donde un sol adornaba el acceso.</p>
            
            <p><strong>Lo curioso:</strong> Antes de ser la plaza bulliciosa que conocemos, aquí se levantaba la Iglesia del Buen Suceso. Se contaba que durante su construcción se halló una imagen de la virgen entre escombros... ¡y huesos de mamut! La gente de la época, con más imaginación que paleontología, creyó que eran restos de gigantes bíblicos.</p>
            
            <p><strong>La Mariblanca:</strong> Si miras bien por la plaza, verás una estatua de una mujer: es la Mariblanca. Originalmente era una Venus comprada en Italia en 1625 que coronaba una fuente. Los madrileños, muy castizos ellos, pasaron de llamarla 'Venus' o 'Diana' y la bautizaron como 'Mariblanca' por la blancura de su mármol. Ha sobrevivido a demoliciones, traslados y vandalismo, convirtiéndose en la verdadera vigilante silenciosa de la plaza.</p>
        `,
        rarity: "LEGENDARY", // Use string to map to logic
        verified: true
    },
    {
        coords: [41.8902, 12.4922], // Colosseum, Rome
        title: "El Coliseo: ¿Batallas Navales en el Centro de Roma?",
        desc: "Gladiadores sí, pero... ¿barcos? La verdad sobre las Naumachias.",
        text: `
            <h3>🚢 Naumachias: Cuando el Coliseo se Inundaba</h3>
            <p>Hollywood nos ha vendido gladiadores y leones, pero se olvida de lo más espectacular: las <strong>Naumachias</strong>. Sí, hubo un tiempo en el que la arena del Coliseo se retiraba, se sellaba el hipogeo y se inundaba todo el recinto con millones de litros de agua traídos por acueductos.</p>
            
            <p><strong>El espectáculo:</strong> Barcos de guerra reales, con prisioneros condenados a muerte, recreaban batallas históricas (como la de Salamina) luchando hasta el final. No era teatro; era una masacre acuática indoor.</p>
            
            <p><strong>El fin de la fiesta:</strong> Al final, el emperador Domiciano decidió que prefería tener sótanos (el hipogeo) para guardar leones y decorados, así que construyó la red de túneles subterráneos que vemos hoy, acabando para siempre con la posibilidad de inundar la arena. Una pena para los fans de las batallas navales, un alivio para los que tenían que limpiar el agua después.</p>
        `,
        rarity: "LEGENDARY",
        verified: true
    },
    {
        coords: [48.8584, 2.2945], // Eiffel Tower, Paris
        title: "Torre Eiffel: La 'Monstruosidad' que Iba a Ser Chatarrra",
        desc: "Odiada por los intelectuales, salvada por la radio.",
        text: `
            <h3>🗼 De 'Trágica Farola' a Icono Mundial</h3>
            <p>Hoy París no se entiende sin ella, pero en 1889, la <em>intelligentsia</em> francesa echaba espuma por la boca. Escritores como Guy de Maupassant la llamaban "esqueleto de atalaya" y "trágica farola". De hecho, Maupassant comía a menudo en el restaurante de la torre. ¿Por qué? Porque, según él, <strong>"es el único lugar de París desde donde no tengo que verla"</strong>.</p>
            
            <p><strong>El plan de demolición:</strong> La licencia de la torre era para solo 20 años. En 1909 debía ser desmantelada y vendida como chatarra. Gustave Eiffel, desesperado por salvar su obra, tuvo una idea genial: la ciencia.</p>
            
            <p><strong>Salvada por la radio:</strong> Eiffel instaló una antena de radio en la cima. Resultó ser estratégica para las comunicaciones militares francesas, especialmente durante la Primera Guerra Mundial para interceptar mensajes enemigos. La utilidad militar venció al odio estético, y la torre se quedó para siempre.</p>
        `,
        rarity: "LEGENDARY",
        verified: true
    },
    {
        coords: [29.9792, 31.1342], // Great Pyramid, Giza
        title: "La Gran Pirámide: Ni Esclavos ni Extraterrestres",
        desc: "Brillaba como una joya blanca bajo el sol del desierto.",
        text: `
            <h3>✨ La Pirámide que Ya No Vemos</h3>
            <p>Olvida la imagen color arena que tienes. Originalmente, la Gran Pirámide de Guiza era de un <strong>blanco cegador</strong>. Estaba recubierta de piedra caliza de Tura, pulida hasta el extremo, y coronada por un <em>piramidión</em> (la punta) probablemente de oro o electrum (aleación oro-plata).</p>
            
            <p><strong>El mito de los esclavos:</strong> Heródoto nos contó que fue hecha por esclavos, y Hollywood lo repitió. Pero la arqueología moderna (gracias a los hallazgos de Zahi Hawass y Mark Lehner) ha encontrado la 'Ciudad de los Constructores'. Eran trabajadores libres, bien alimentados (comían carne y pescado a diario) y enterrados con honor junto a la pirámide. No eran esclavos; eran, quizás, los primeros funcionarios orgullosos de la historia.</p>
            
            <p><strong>¿Dónde está el recubrimiento?</strong> Un terremoto en el siglo XIV d.C. aflojó las piedras blancas, y los sultanes mamelucos de El Cairo dijeron "gracias" y se las llevaron para construir mezquitas y fortalezas en la ciudad. Básicamente, El Cairo antiguo está hecho con la 'piel' de las pirámides.</p>
        `,
        rarity: "LEGENDARY",
        verified: true
    },
    {
        coords: [27.1751, 78.0421], // Taj Mahal, India
        title: "Taj Mahal: El Mito del 'Taj Negro'",
        desc: "La leyenda de un gemelo oscuro al otro lado del río.",
        text: `
            <h3>🌑 El Taj Mahal Negro que Nunca Existió</h3>
            <p>Una de las leyendas más fascinantes (y falsas) es que el emperador Shah Jahan planeaba construir una réplica exacta del Taj Mahal en mármol negro para su propia tumba, justo al otro lado del río Yamuna, y unirlos con un puente de plata.</p>
            
            <p><strong>El origen del mito:</strong> El viajero francés Jean-Baptiste Tavernier visitó Agra en 1665 y escribió sobre esto. Siglos después, arqueólogos encontraron mármol negro en el "Jardín de la Luz de la Luna" al otro lado del río. ¡Eureka! ¿O no?</p>
            
            <p><strong>La realidad aburrida:</strong> Análisis modernos demostraron que el "mármol negro" eran en realidad piedras blancas que se habían oscurecido y llenado de hongos tras siglos de abandono. Además, Shah Jahan pasó sus últimos años encerrado por su hijo en el Fuerte de Agra, mirando tristemente al Taj Mahal blanco. No tenía ni presupuesto ni libertad para construir su gemelo oscuro. A veces, la historia es menos gótica de lo que nos gustaría.</p>
        `,
        rarity: "LEGENDARY",
        verified: true
    },
    {
        coords: [40.6892, -74.0445], // Statue of Liberty, NYC
        title: "Estatua de la Libertad: El Regalo Egipcio Reciclado",
        desc: "No siempre fue verde, y originalmente iba a ser una campesina egipcia.",
        text: `
            <h3>🗽 De Egipto a Nueva York (con cambio de look)</h3>
            <p>El escultor Frédéric Auguste Bartholdi originalmente diseñó esta colosal estatua para la entrada del Canal de Suez en Egipto. Se iba a llamar "Egipto llevando la luz a Asia" y representaba a una campesina egipcia con velo. Egipto, sin dinero, dijo "no, gracias".</p>
            
            <p><strong>El reciclaje épico:</strong> Bartholdi no se rindió, le cambió la ropa para que pareciera más una diosa grecorromana (Libertas), y se la vendió a Estados Unidos como regalo de Francia por su centenario. Pero EE.UU. tardó años en querer pagarse el pedestal.</p>
            
            <p><strong>No era verde:</strong> Cuando se inauguró en 1886, brillaba con un color <strong>cobre rojizo</strong> (como un penique nuevo). Tardó unos 30 años en oxidarse y volverse verde. Las autoridades pensaron en pintarla, pero la gente ya se había acostumbrado a su aspecto 'fantasma verde'.</p>
        `,
        rarity: "LEGENDARY",
        verified: true
    },
    {
        coords: [-13.1631, -72.5450], // Machu Picchu, Peru
        title: "Machu Picchu: La Ciudad 'Perdida' que Tenía Dueño",
        desc: "Hiram Bingham no la descubrió, los locales ya vivían allí.",
        text: `
            <h3>⛰️ ¿Descubrimiento o Visita Turística?</h3>
            <p>En 1911, Hiram Bingham llegó a Machu Picchu y el mundo gritó "¡Ciudad Perdida descubierta!". La realidad es un poco más incómoda: cuando Bingham llegó, <strong>ya había gente viviendo allí</strong>.</p>
            
            <p><strong>Los verdaderos anfitriones:</strong> Una familia local, los Arteaga, cultivaba en las terrazas incas y vivía en las ruinas. Un niño de la familia, Pablito, fue quien guió a Bingham hasta la ciudadela por unas monedas. Para los locales no estaba perdida, solo era su patio trasero.</p>
            
            <p><strong>¿Qué era realmente?</strong> No era una fortaleza militar. Hoy se cree que fue una "finca real" (residencia de verano) del inca Pachacútec. Un lugar para descansar, cazar y escapar del estrés de Cuzco. Vamos, la casa de la playa de los Incas, pero a 2.400 metros de altura.</p>
        `,
        rarity: "LEGENDARY",
        verified: true
    },
    {
        coords: [40.4319, 116.5704], // Great Wall (Mutianyu section)
        title: "La Gran Muralla: El Mito Espacial y el Arroz",
        desc: "No se ve desde el espacio, pero se mantiene en pie gracias a la sopa.",
        text: `
            <h3>🍚 El Secreto es el Arroz Pegajoso</h3>
            <p>Primero, quitémonos la mentira de encima: <strong>No, la Gran Muralla China no se ve desde el espacio</strong> a simple vista. Es muy larga, sí, pero demasiado estrecha (como intentar ver un pelo humano desde un avión).</p>
            
            <p><strong>Ingeniería culinaria:</strong> Lo verdaderamente alucinante es por qué sigue en pie. Los científicos descubrieron que la argamasa utilizada en la dinastía Ming contenía un ingrediente secreto: <strong>sopa de arroz glutinoso</strong>. La amilopectina del arroz hacía la mezcla casi indestructible, resistente a terremotos y al paso del tiempo. Básicamente, la mayor estructura militar de la historia se sostiene gracias a la comida.</p>
        `,
        rarity: "LEGENDARY",
        verified: true
    },
    {
        coords: [20.6843, -88.5678], // Chichen Itza, Mexico
        title: "Chichén Itzá: La Pirámide que Canta",
        desc: "Una maravilla acústica que imita al pájaro sagrado.",
        text: `
            <h3>🐦 El Canto del Quetzal</h3>
            <p>Si te pones frente a la escalinata norte de la pirámide de Kukulcán y das una palmada fuerte, el eco no suena como una palmada. Suena como un <strong>chillido agudo</strong>.</p>
            
            <p><strong>Ingeniería sonora:</strong> Los físicos han confirmado que el sonido rebota en los escalones de tal forma que imita casi a la perfección el canto del <strong>Quetzal</strong>, el pájaro sagrado de los Mayas. No es casualidad. Los mayas eran maestros de la acústica.</p>
            
            <p><strong>El cenote sagrado:</strong> No todo es bonito. Cerca está el Cenote Sagrado, donde se tiraban ofrendas... y personas. Durante mucho tiempo se creyó que eran solo doncellas vírgenes, pero los análisis de huesos muestran que tiraban hombres, mujeres y niños por igual. La lluvia no discriminaba, y los sacrificios tampoco.</p>
        `,
        rarity: "LEGENDARY",
        verified: true
    }
];

// Helper to find closest curated point (within ~200m)
function findCuratedStory(lat, lng) {
    const threshold = 0.005; // approx 500m logic
    return CURATED_POIS.find(p => {
        const d = Math.sqrt(Math.pow(p.coords[0] - lat, 2) + Math.pow(p.coords[1] - lng, 2));
        return d < threshold;
    });
}
