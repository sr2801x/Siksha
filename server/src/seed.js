// Demo data so the platform is usable immediately.
// Run `npm run seed` to wipe and re-seed, or it runs automatically on first start.
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { User, Resource, Quiz, Attempt } = require('./models');
const { UPLOAD_DIR } = require('./utils/storage');
const { makePdf } = require('./utils/pdf');

const DEMO = {
  teacher: { name: 'Miss Radha', email: 'teacher@siksha.com', password: 'teacher123' },
  teacher2: { name: 'Ms. Priya Verma', email: 'priya@siksha.com', password: 'teacher123' },
  student: { name: 'Aarav Mehta', email: 'student@siksha.com', password: 'student123', className: '9' },
  student2: { name: 'Ananya Singh', email: 'ananya@siksha.com', password: 'student123', className: '9' },
  student3: { name: 'Rohan Gupta', email: 'rohan@siksha.com', password: 'student123', className: '10' },
};

const yt = (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
const wiki = (t) => `https://en.wikipedia.org/wiki/${t}`;

const NOTES = [
  {
    className: '9', subject: 'Mathematics', topic: 'Polynomials', title: 'Polynomials – Complete Notes',
    description: 'Degree, zeroes, Remainder Theorem and Factor Theorem with solved examples.', tags: ['algebra', 'cbse'],
    content: `# Polynomials

A **polynomial** in one variable *x* is an expression of the form
\`aₙxⁿ + aₙ₋₁xⁿ⁻¹ + … + a₁x + a₀\`, where the exponents are whole numbers.

## Types by degree
| Degree | Name | Example |
|---|---|---|
| 0 | Constant | 7 |
| 1 | Linear | 2x + 3 |
| 2 | Quadratic | x² − 5x + 6 |
| 3 | Cubic | x³ − 1 |

## Zeroes of a polynomial
A number *a* is a **zero** of p(x) if **p(a) = 0**.
> Example: for p(x) = x − 4, the zero is x = 4.

## Remainder Theorem
If p(x) is divided by (x − a), the remainder is **p(a)**.

**Example:** remainder when x³ + 1 is divided by x + 1 → p(−1) = −1 + 1 = **0**.

## Factor Theorem
(x − a) is a factor of p(x) **if and only if** p(a) = 0.

## Useful identities
- (x + y)² = x² + 2xy + y²
- (x − y)² = x² − 2xy + y²
- x² − y² = (x + y)(x − y)
- (x + y)³ = x³ + y³ + 3xy(x + y)
- x³ + y³ + z³ − 3xyz = (x + y + z)(x² + y² + z² − xy − yz − zx)

### Quick check ✅
1. What is the degree of 5x³ − 2x + 1? → **3**
2. Is (x − 2) a factor of x² − 4? → **Yes**, since 2² − 4 = 0.`,
  },
  {
    className: '9', subject: 'Science', topic: 'Motion', title: 'Motion – Distance, Displacement & Equations',
    description: 'Speed, velocity, acceleration and the three equations of motion.', tags: ['physics', 'kinematics'],
    content: `# Motion

## Distance vs Displacement
- **Distance** – total path length covered (scalar).
- **Displacement** – shortest straight-line distance from start to end, with direction (vector).

## Speed and Velocity
- Speed = distance ÷ time (SI unit: m/s)
- Velocity = displacement ÷ time
- Average speed = total distance ÷ total time

## Acceleration
Rate of change of velocity: **a = (v − u) / t** (unit m/s²).
Negative acceleration is called **retardation**.

## Equations of motion (uniform acceleration)
1. **v = u + at**
2. **s = ut + ½at²**
3. **v² = u² + 2as**

> 🚗 A car starts from rest and accelerates at 2 m/s² for 5 s.
> v = 0 + 2×5 = **10 m/s**; s = 0 + ½×2×25 = **25 m**.

## Uniform circular motion
Speed is constant but direction changes continuously, so the motion is **accelerated**.
v = 2πr / T`,
  },
  {
    className: '9', subject: 'Science', topic: 'Atoms and Molecules', title: 'Atoms and Molecules – Key Concepts',
    description: 'Laws of chemical combination, atomic mass, mole concept.', tags: ['chemistry'],
    content: `# Atoms and Molecules

## Laws of chemical combination
- **Law of conservation of mass** – mass is neither created nor destroyed in a chemical reaction.
- **Law of constant proportions** – a compound always contains the same elements in the same proportion by mass.

## Dalton's atomic theory (key points)
1. Matter is made of tiny particles called atoms.
2. Atoms of an element are identical in mass and properties.
3. Atoms combine in small whole-number ratios to form compounds.

## Atomic mass
Measured in **atomic mass units (u)** – 1/12th of the mass of a carbon-12 atom.

## Molecular mass
Sum of atomic masses: H₂O = 2(1) + 16 = **18 u**.

## The mole
1 mole = **6.022 × 10²³** particles (Avogadro's number).
Number of moles = given mass ÷ molar mass.

> Example: 36 g of water = 36 ÷ 18 = **2 moles**.`,
  },
  {
    className: '9', subject: 'Social Studies', topic: 'The French Revolution', title: 'The French Revolution – Summary Notes',
    description: 'Causes, major events of 1789 and the legacy of the revolution.', tags: ['history'],
    content: `# The French Revolution (1789)

## Causes
- **Social inequality** – society divided into three Estates; the Third Estate paid almost all taxes.
- **Financial crisis** – long wars and the expenses of Louis XVI's court emptied the treasury.
- **Rise of the middle class** and ideas of philosophers like **Rousseau**, **Locke** and **Montesquieu**.
- **Subsistence crisis** – rising bread prices.

## Key events
| Year | Event |
|---|---|
| 1789 | Meeting of the Estates-General; Tennis Court Oath; **Storming of the Bastille (14 July)** |
| 1789 | Declaration of the Rights of Man and Citizen |
| 1791 | Constitution limits the power of the monarch |
| 1792 | France becomes a republic |
| 1793–94 | Reign of Terror under Robespierre |

## Legacy
Ideas of **liberty, equality and fraternity** spread across Europe and inspired later freedom movements.`,
  },
  {
    className: '9', subject: 'English', topic: 'Tenses', title: 'Tenses – Rules & Examples',
    description: 'All 12 tenses with structure and examples.', tags: ['grammar'],
    content: `# Tenses

| Tense | Structure | Example |
|---|---|---|
| Simple Present | S + V1(s/es) | She **reads** daily. |
| Present Continuous | S + is/am/are + V-ing | She **is reading**. |
| Present Perfect | S + has/have + V3 | She **has read** it. |
| Present Perfect Continuous | S + has/have been + V-ing | She **has been reading** for an hour. |
| Simple Past | S + V2 | She **read** it yesterday. |
| Past Continuous | S + was/were + V-ing | She **was reading**. |
| Past Perfect | S + had + V3 | She **had read** it before class. |
| Simple Future | S + will + V1 | She **will read** tomorrow. |

## Tips
- Use **since** with a point of time, **for** with a period of time.
- Don't use the present perfect with a specific past time (❌ *I have seen him yesterday*).`,
  },
  {
    className: '10', subject: 'Science', topic: 'Chemical Reactions and Equations', title: 'Chemical Reactions – Types & Balancing',
    description: 'Combination, decomposition, displacement, redox reactions.', tags: ['chemistry'],
    content: `# Chemical Reactions and Equations

## Balancing equations
Atoms of each element must be equal on both sides.
\`2H₂ + O₂ → 2H₂O\`

## Types of reactions
1. **Combination:** A + B → AB — e.g. CaO + H₂O → Ca(OH)₂
2. **Decomposition:** AB → A + B — e.g. 2FeSO₄ → Fe₂O₃ + SO₂ + SO₃ (on heating)
3. **Displacement:** Fe + CuSO₄ → FeSO₄ + Cu
4. **Double displacement:** Na₂SO₄ + BaCl₂ → BaSO₄↓ + 2NaCl
5. **Redox:** oxidation and reduction occur together.

## Oxidation & Reduction
- **Oxidation** – gain of oxygen / loss of hydrogen
- **Reduction** – loss of oxygen / gain of hydrogen

## Effects in daily life
- **Corrosion** – rusting of iron
- **Rancidity** – oxidation of fats and oils (prevented by antioxidants, nitrogen packing)`,
  },
  {
    className: '10', subject: 'Mathematics', topic: 'Quadratic Equations', title: 'Quadratic Equations – Formula & Nature of Roots',
    description: 'Standard form, factorisation, quadratic formula, discriminant.', tags: ['algebra'],
    content: `# Quadratic Equations

Standard form: **ax² + bx + c = 0**, a ≠ 0.

## Methods of solving
1. **Factorisation** – split the middle term.
   x² − 5x + 6 = 0 → (x − 2)(x − 3) = 0 → x = 2, 3
2. **Quadratic formula**
   x = [−b ± √(b² − 4ac)] / 2a

## Discriminant D = b² − 4ac
| D | Nature of roots |
|---|---|
| D > 0 | Two distinct real roots |
| D = 0 | Two equal real roots |
| D < 0 | No real roots |

## Sum and product of roots
- α + β = −b/a
- αβ = c/a`,
  },
  {
    className: '10', subject: 'Mathematics', topic: 'Trigonometry', title: 'Introduction to Trigonometry',
    description: 'Ratios, standard angle values and identities.', tags: ['trigonometry'],
    content: `# Introduction to Trigonometry

In a right triangle with angle θ:
- sin θ = Opposite / Hypotenuse
- cos θ = Adjacent / Hypotenuse
- tan θ = Opposite / Adjacent = sin θ / cos θ

## Standard values
| θ | 0° | 30° | 45° | 60° | 90° |
|---|---|---|---|---|---|
| sin | 0 | 1/2 | 1/√2 | √3/2 | 1 |
| cos | 1 | √3/2 | 1/√2 | 1/2 | 0 |
| tan | 0 | 1/√3 | 1 | √3 | not defined |

## Identities
- sin²θ + cos²θ = 1
- 1 + tan²θ = sec²θ
- 1 + cot²θ = cosec²θ`,
  },
  {
    className: '8', subject: 'Science', topic: 'Cell Structure', title: 'Cell – Structure and Functions',
    description: 'Parts of a cell, plant vs animal cells.', tags: ['biology'],
    content: `# Cell – Structure and Functions

The **cell** is the basic structural and functional unit of life.

## Parts of a cell
- **Cell membrane** – controls entry and exit of substances
- **Cytoplasm** – jelly-like fluid where cell organelles are found
- **Nucleus** – controls all activities; contains chromosomes

## Plant cell vs Animal cell
| Plant cell | Animal cell |
|---|---|
| Has a cell wall | No cell wall |
| Has chloroplasts | No chloroplasts |
| Large central vacuole | Small or no vacuoles |

## Prokaryotes vs Eukaryotes
Bacteria are **prokaryotes** – no well-defined nucleus.`,
  },
  {
    className: '8', subject: 'Mathematics', topic: 'Linear Equations in One Variable', title: 'Linear Equations in One Variable',
    description: 'Solving equations with variables on both sides, word problems.', tags: ['algebra'],
    content: `# Linear Equations in One Variable

A linear equation has the highest power of the variable equal to **1**.

## Solving
Do the same operation on both sides.
> 2x + 5 = 17 → 2x = 12 → **x = 6**

## Variables on both sides
> 3x − 4 = x + 6 → 2x = 10 → **x = 5**

## Word problem
The sum of two consecutive numbers is 41. Find them.
Let the numbers be x and x + 1 → 2x + 1 = 41 → x = 20 → **20 and 21**.`,
  },
];

const PDFS = [
  {
    className: '9', subject: 'Mathematics', topic: 'Polynomials', title: 'Polynomials – Practice Worksheet (PDF)',
    description: 'Printable worksheet with 15 practice questions.',
    body: `Section A - Very short answer
1. Write the degree of 4x^4 + 0x^3 + 0x^5 + 5x + 7.
2. Find the zero of p(x) = 2x + 5.
3. Classify x^2 + x as linear, quadratic or cubic.
4. Find p(0), p(1) and p(2) for p(y) = y^2 - y + 1.
5. Write the coefficient of x^2 in (pi/2)x^2 + x.

Section B - Short answer
6. Find the remainder when x^3 + 3x^2 + 3x + 1 is divided by x + 1.
7. Check whether 7 + 3x is a factor of 3x^3 + 7x.
8. Factorise 12x^2 - 7x + 1.
9. Factorise x^3 - 2x^2 - x + 2.
10. Evaluate 104 x 96 using a suitable identity.

Section C - Long answer
11. Expand (2x - y + z)^2.
12. Factorise 27y^3 + 125z^3.
13. Without actually calculating the cubes, find (-12)^3 + 7^3 + 5^3.
14. If x + y + z = 0, show that x^3 + y^3 + z^3 = 3xyz.
15. Give possible expressions for the length and breadth of a rectangle whose area is 25a^2 - 35a + 12.

Answers (selected): 1) 5   2) -5/2   6) 0   8) (3x - 1)(4x - 1)   10) 9984   13) -1260`,
  },
  {
    className: '9', subject: 'Science', topic: 'Motion', title: 'Motion – Formula Sheet (PDF)',
    description: 'One-page revision sheet with every formula you need.',
    body: `Quantities and SI units
Distance (m), Displacement (m), Speed (m/s), Velocity (m/s), Acceleration (m/s^2)

Key formulas
Average speed = total distance / total time
Average velocity = (u + v) / 2   (for uniform acceleration)
Acceleration a = (v - u) / t

Equations of motion
1) v = u + at
2) s = ut + (1/2)at^2
3) v^2 = u^2 + 2as

Uniform circular motion
v = 2 x pi x r / T

Graphs
- Slope of a distance-time graph = speed
- Slope of a velocity-time graph = acceleration
- Area under a velocity-time graph = displacement

Remember: a body moving in a circle at constant speed is accelerating, because its direction keeps changing.`,
  },
  {
    className: '10', subject: 'Science', topic: 'Chemical Reactions and Equations', title: 'Chemical Reactions – Important Questions (PDF)',
    description: 'Board-exam style questions with hints.',
    body: `1. Why should a magnesium ribbon be cleaned before burning in air?
   Hint: to remove the layer of magnesium oxide on its surface.
2. Write the balanced equation: Hydrogen + Chlorine -> Hydrogen chloride.
   Answer: H2 + Cl2 -> 2HCl
3. What is a decomposition reaction? Give an example where heat is used.
   Answer: CaCO3 -> CaO + CO2 (on heating)
4. Why does the colour of copper sulphate solution change when an iron nail is dipped in it?
   Hint: iron displaces copper (displacement reaction).
5. Explain oxidation and reduction with the example CuO + H2 -> Cu + H2O.
6. Why are food bags flushed with nitrogen?
   Hint: to prevent rancidity by stopping oxidation.
7. What is corrosion? Name two methods to prevent rusting.`,
  },
];

const LINKS = [
  { className: '9', subject: 'Mathematics', topic: 'Polynomials', type: 'video', title: 'Video lessons: Polynomials Class 9', url: yt('polynomials class 9 one shot'), description: 'Curated YouTube lessons on polynomials.' },
  { className: '9', subject: 'Science', topic: 'Motion', type: 'video', title: 'Video lessons: Equations of Motion', url: yt('equations of motion class 9 physics'), description: 'Watch derivations and solved numericals.' },
  { className: '10', subject: 'Mathematics', topic: 'Trigonometry', type: 'video', title: 'Video lessons: Trigonometry basics', url: yt('introduction to trigonometry class 10'), description: 'Visual explanations of sin, cos and tan.' },
  { className: '9', subject: 'Science', topic: 'Atoms and Molecules', type: 'link', source: 'external', title: 'Wikipedia: Mole (unit)', url: wiki('Mole_(unit)'), description: 'Read more about the mole and Avogadro\'s number.' },
  { className: '9', subject: 'Social Studies', topic: 'The French Revolution', type: 'link', source: 'external', title: 'Wikipedia: French Revolution', url: wiki('French_Revolution'), description: 'Detailed encyclopaedia article.' },
  { className: '10', subject: 'Mathematics', topic: 'Quadratic Equations', type: 'link', source: 'external', title: 'Wikipedia: Quadratic formula', url: wiki('Quadratic_formula'), description: 'Derivation and history of the quadratic formula.' },
  { className: '8', subject: 'Science', topic: 'Cell Structure', type: 'link', source: 'external', title: 'Wikipedia: Cell (biology)', url: wiki('Cell_(biology)'), description: 'Diagrams of plant and animal cells.' },
];

const q = (text, options, correctIndex, explanation) => ({ text, options, correctIndex, explanation });

const QUIZZES = [
  {
    className: '9', subject: 'Mathematics', topic: 'Polynomials', title: 'Polynomials – Basics', difficulty: 'easy', durationMinutes: 8,
    description: 'Degree, zeroes and the remainder theorem.',
    questions: [
      q('What is the degree of 5x³ − 2x + 1?', ['1', '2', '3', '5'], 2, 'The highest power of x is 3.'),
      q('The zero of p(x) = 2x − 6 is:', ['2', '3', '−3', '6'], 1, '2x − 6 = 0 ⇒ x = 3.'),
      q('Remainder when x³ + 1 is divided by (x + 1):', ['0', '1', '2', '−1'], 0, 'p(−1) = −1 + 1 = 0.'),
      q('x² − 9 can be factorised as:', ['(x − 3)²', '(x + 3)(x − 3)', '(x + 9)(x − 1)', 'x(x − 9)'], 1, 'Use a² − b² = (a + b)(a − b).'),
      q('A polynomial of degree 1 is called:', ['Constant', 'Linear', 'Quadratic', 'Cubic'], 1, 'Degree 1 → linear.'),
    ],
  },
  {
    className: '9', subject: 'Mathematics', topic: 'Polynomials', title: 'Polynomials – Identities Challenge', difficulty: 'hard', durationMinutes: 10,
    description: 'Algebraic identities and factor theorem.',
    questions: [
      q('If x + y + z = 0, then x³ + y³ + z³ equals:', ['0', 'xyz', '3xyz', '(x+y+z)³'], 2, 'From the identity x³+y³+z³−3xyz = (x+y+z)(…), the left side is 0.'),
      q('Value of 104 × 96 using identities:', ['9984', '9996', '10016', '9894'], 0, '(100+4)(100−4) = 10000 − 16 = 9984.'),
      q('Is (x − 1) a factor of x³ − 1?', ['Yes', 'No'], 0, 'p(1) = 1 − 1 = 0, so yes.'),
      q('(x + y)³ equals:', ['x³ + y³', 'x³ + y³ + 3xy(x + y)', 'x³ + 3x²y + y³', 'x³ − y³ + 3xy'], 1, 'Standard cube identity.'),
    ],
  },
  {
    className: '9', subject: 'Science', topic: 'Motion', title: 'Motion – Equations of Motion', difficulty: 'medium', durationMinutes: 10,
    description: 'Numericals and concepts on speed, velocity and acceleration.',
    questions: [
      q('The SI unit of acceleration is:', ['m/s', 'm/s²', 'm²/s', 'km/h'], 1, 'Acceleration = change in velocity / time ⇒ m/s².'),
      q('A car starts from rest and reaches 20 m/s in 5 s. Its acceleration is:', ['2 m/s²', '4 m/s²', '5 m/s²', '100 m/s²'], 1, 'a = (20 − 0)/5 = 4 m/s².'),
      q('Which quantity is a vector?', ['Distance', 'Speed', 'Displacement', 'Time'], 2, 'Displacement has both magnitude and direction.'),
      q('Area under a velocity-time graph gives:', ['Acceleration', 'Displacement', 'Speed', 'Force'], 1, 'Area of v-t graph = displacement.'),
      q('Uniform circular motion is:', ['Uniform velocity', 'Non-accelerated', 'Accelerated', 'Always at rest'], 2, 'Direction changes continuously, so velocity changes ⇒ accelerated.'),
      q('Using v² = u² + 2as, a body with u = 0, a = 2 m/s², s = 25 m has v =', ['5 m/s', '10 m/s', '50 m/s', '100 m/s'], 1, 'v² = 0 + 2×2×25 = 100 ⇒ v = 10 m/s.'),
    ],
  },
  {
    className: '9', subject: 'Science', topic: 'Atoms and Molecules', title: 'Atoms & Molecules – Mole Concept', difficulty: 'medium', durationMinutes: 8,
    description: 'Atomic mass, molecular mass and moles.',
    questions: [
      q('Molecular mass of H₂O is:', ['16 u', '17 u', '18 u', '20 u'], 2, '2×1 + 16 = 18 u.'),
      q('Avogadro\'s number is:', ['6.022 × 10²³', '3 × 10⁸', '1.6 × 10⁻¹⁹', '9.8'], 0, 'One mole contains 6.022 × 10²³ particles.'),
      q('Number of moles in 36 g of water:', ['1', '2', '3', '18'], 1, '36 / 18 = 2 moles.'),
      q('Who proposed the atomic theory in 1808?', ['Rutherford', 'Bohr', 'Dalton', 'Thomson'], 2, 'John Dalton.'),
      q('Law of conservation of mass was given by:', ['Lavoisier', 'Proust', 'Newton', 'Avogadro'], 0, 'Antoine Lavoisier.'),
    ],
  },
  {
    className: '9', subject: 'Social Studies', topic: 'The French Revolution', title: 'French Revolution – Quick Quiz', difficulty: 'easy', durationMinutes: 6,
    description: 'Key dates and ideas.',
    questions: [
      q('The Bastille was stormed on:', ['14 July 1789', '4 July 1776', '26 January 1950', '1 May 1791'], 0, '14 July 1789 is celebrated as Bastille Day.'),
      q('Who wrote "The Social Contract"?', ['Locke', 'Rousseau', 'Montesquieu', 'Voltaire'], 1, 'Jean-Jacques Rousseau.'),
      q('The period 1793–94 is known as:', ['Age of Reason', 'Reign of Terror', 'Glorious Revolution', 'Renaissance'], 1, 'Led by Robespierre.'),
      q('Which Estate paid most of the taxes?', ['First', 'Second', 'Third', 'None'], 2, 'The Third Estate — commoners.'),
    ],
  },
  {
    className: '9', subject: 'English', topic: 'Tenses', title: 'Tenses – Grammar Check', difficulty: 'easy', durationMinutes: 5,
    description: 'Pick the correct tense.',
    questions: [
      q('She ___ in Delhi since 2015.', ['lives', 'is living', 'has been living', 'lived'], 2, 'Since + point of time → present perfect continuous.'),
      q('I ___ him yesterday.', ['have seen', 'saw', 'see', 'had seen'], 1, 'Specific past time → simple past.'),
      q('Look! The baby ___.', ['sleeps', 'is sleeping', 'slept', 'has slept'], 1, 'Action happening now → present continuous.'),
      q('By the time we arrived, the film ___.', ['started', 'has started', 'had started', 'starts'], 2, 'Earlier past action → past perfect.'),
    ],
  },
  {
    className: '10', subject: 'Science', topic: 'Chemical Reactions and Equations', title: 'Types of Chemical Reactions', difficulty: 'medium', durationMinutes: 8,
    description: 'Identify reaction types.',
    questions: [
      q('Fe + CuSO₄ → FeSO₄ + Cu is a:', ['Combination reaction', 'Decomposition reaction', 'Displacement reaction', 'Double displacement'], 2, 'Iron displaces copper.'),
      q('CaCO₃ → CaO + CO₂ is a:', ['Combination', 'Decomposition', 'Displacement', 'Redox'], 1, 'One substance breaks into two.'),
      q('Rancidity is caused by:', ['Reduction', 'Oxidation', 'Neutralisation', 'Sublimation'], 1, 'Oxidation of fats and oils.'),
      q('Gain of oxygen is called:', ['Oxidation', 'Reduction', 'Corrosion', 'Precipitation'], 0, 'Oxidation = gain of oxygen.'),
      q('Food bags are flushed with:', ['Oxygen', 'Nitrogen', 'Hydrogen', 'Chlorine'], 1, 'Nitrogen prevents oxidation.'),
    ],
  },
  {
    className: '10', subject: 'Mathematics', topic: 'Quadratic Equations', title: 'Quadratic Equations – Roots', difficulty: 'medium', durationMinutes: 8,
    description: 'Discriminant and roots.',
    questions: [
      q('Roots of x² − 5x + 6 = 0 are:', ['1, 6', '2, 3', '−2, −3', '−1, 6'], 1, '(x − 2)(x − 3) = 0.'),
      q('If D = 0, the roots are:', ['Distinct real', 'Equal real', 'Not real', 'Zero'], 1, 'D = 0 → two equal real roots.'),
      q('Discriminant of 2x² − 4x + 3 = 0:', ['−8', '8', '4', '−4'], 0, '16 − 24 = −8.'),
      q('Sum of the roots of x² − 7x + 10 = 0:', ['7', '−7', '10', '3'], 0, 'α + β = −b/a = 7.'),
    ],
  },
  {
    className: '10', subject: 'Mathematics', topic: 'Trigonometry', title: 'Trigonometric Ratios', difficulty: 'easy', durationMinutes: 6,
    description: 'Standard values and identities.',
    questions: [
      q('sin 30° =', ['1', '1/2', '√3/2', '0'], 1, 'Standard value.'),
      q('tan 45° =', ['0', '1', '√3', '1/√3'], 1, 'sin45/cos45 = 1.'),
      q('sin²θ + cos²θ =', ['0', '1', '2', 'tan θ'], 1, 'Fundamental identity.'),
      q('tan 90° is:', ['0', '1', '∞ / not defined', '√3'], 2, 'cos 90° = 0.'),
    ],
  },
  {
    className: '8', subject: 'Science', topic: 'Cell Structure', title: 'Cell Structure Quiz', difficulty: 'easy', durationMinutes: 5,
    description: 'Parts of the cell.',
    questions: [
      q('The control centre of the cell is the:', ['Cytoplasm', 'Nucleus', 'Cell wall', 'Vacuole'], 1, 'The nucleus controls cell activities.'),
      q('Which is found only in plant cells?', ['Cell membrane', 'Nucleus', 'Chloroplast', 'Cytoplasm'], 2, 'Chloroplasts carry out photosynthesis.'),
      q('Bacteria are:', ['Eukaryotes', 'Prokaryotes', 'Viruses', 'Multicellular'], 1, 'No well-defined nucleus.'),
    ],
  },
  {
    className: '8', subject: 'Mathematics', topic: 'Linear Equations in One Variable', title: 'Linear Equations Practice', difficulty: 'easy', durationMinutes: 6,
    description: 'Solve for x.',
    questions: [
      q('Solve 2x + 5 = 17', ['5', '6', '7', '11'], 1, '2x = 12 → x = 6.'),
      q('Solve 3x − 4 = x + 6', ['3', '5', '10', '2'], 1, '2x = 10 → x = 5.'),
      q('Two consecutive numbers add to 41. The smaller one is:', ['19', '20', '21', '22'], 1, 'x + x + 1 = 41 → x = 20.'),
    ],
  },
];

// Simulated past attempts for demo students: [quizTitle, answersPattern, daysAgo]
function fakeAnswers(quiz, accuracy, seed) {
  // Deterministic: answer the first round(accuracy × n) questions (in a shuffled order) correctly
  const n = quiz.questions.length;
  const order = quiz.questions.map((_, i) => i).sort((a, b) => ((a * 31 + seed) % 7) - ((b * 31 + seed) % 7));
  const right = new Set(order.slice(0, Math.round(accuracy * n)));
  return quiz.questions.map((qq, i) => (right.has(i) ? qq.correctIndex : (qq.correctIndex + 1) % qq.options.length));
}

async function seed({ wipe = true } = {}) {
  if (wipe) await Promise.all([User.deleteMany({}), Resource.deleteMany({}), Quiz.deleteMany({}), Attempt.deleteMany({})]);
  const hash = (p) => bcrypt.hash(p, 10);

  const [teacher, teacher2, student, student2, student3] = await User.create([
    { ...DEMO.teacher, role: 'teacher', subjectsTaught: ['Mathematics', 'Science'], passwordHash: await hash(DEMO.teacher.password) },
    { ...DEMO.teacher2, role: 'teacher', subjectsTaught: ['English', 'Social Studies'], passwordHash: await hash(DEMO.teacher2.password) },
    { ...DEMO.student, role: 'student', passwordHash: await hash(DEMO.student.password) },
    { ...DEMO.student2, role: 'student', passwordHash: await hash(DEMO.student2.password) },
    { ...DEMO.student3, role: 'student', passwordHash: await hash(DEMO.student3.password) },
  ]);
  const owner = (subject) => (['English', 'Social Studies'].includes(subject) ? teacher2._id : teacher._id);

  const views = () => Math.floor(Math.random() * 120) + 5;
  const resources = [];
  for (const n of NOTES) resources.push({ ...n, type: 'notes', createdBy: owner(n.subject), views: views() });
  for (const p of PDFS) {
    const name = `${p.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.pdf`;
    fs.writeFileSync(path.join(UPLOAD_DIR, name), makePdf(p.title.replace(' (PDF)', ''), p.body));
    resources.push({ ...p, body: undefined, type: 'pdf', url: `/uploads/${name}`, fileName: name, createdBy: owner(p.subject), views: views() });
  }
  for (const l of LINKS) resources.push({ ...l, createdBy: owner(l.subject), views: views() });
  const created = await Resource.insertMany(resources);

  const quizzes = await Quiz.insertMany(QUIZZES.map((qz) => ({ ...qz, createdBy: owner(qz.subject) })));
  const byTitle = Object.fromEntries(quizzes.map((x) => [x.title, x]));

  const plan = [
    [student, 'Polynomials – Basics', 0.6, 9], [student, 'Polynomials – Basics', 1, 7], [student, 'Motion – Equations of Motion', 0.5, 6],
    [student, 'Atoms & Molecules – Mole Concept', 0.8, 5], [student, 'French Revolution – Quick Quiz', 0.4, 3], [student, 'Tenses – Grammar Check', 0.9, 2],
    [student, 'Polynomials – Identities Challenge', 0.45, 1], [student, 'Motion – Equations of Motion', 0.7, 0],
    [student2, 'Polynomials – Basics', 0.9, 4], [student2, 'Motion – Equations of Motion', 0.85, 3], [student2, 'Tenses – Grammar Check', 0.7, 1],
    [student3, 'Quadratic Equations – Roots', 0.75, 3], [student3, 'Types of Chemical Reactions', 0.6, 2], [student3, 'Trigonometric Ratios', 1, 1],
  ];
  const attempts = plan.map(([s, title, acc, daysAgo], idx) => {
    const quiz = byTitle[title];
    const answers = fakeAnswers(quiz, acc, idx * 13);
    const score = answers.filter((a, i) => a === quiz.questions[i].correctIndex).length;
    const date = new Date(Date.now() - daysAgo * 86400000 - idx * 3600000);
    return {
      quiz: quiz._id, student: s._id, answers, score, total: quiz.questions.length,
      percentage: Math.round((score / quiz.questions.length) * 100), timeTakenSec: 60 + ((idx * 37) % 300),
      subject: quiz.subject, topic: quiz.topic, className: quiz.className, quizTitle: quiz.title, createdAt: date, updatedAt: date,
    };
  });
  await Attempt.insertMany(attempts);

  student.completed = created.filter((r) => r.className === '9').slice(0, 3).map((r) => r._id);
  student.bookmarks = created.filter((r) => r.className === '9' && r.type === 'pdf').map((r) => r._id);
  await student.save();

  console.log(`🌱 Seeded ${created.length} resources, ${quizzes.length} quizzes, ${attempts.length} attempts`);
  console.log(`   Teacher: ${DEMO.teacher.email} / ${DEMO.teacher.password}`);
  console.log(`   Student: ${DEMO.student.email} / ${DEMO.student.password}`);
}

async function seedIfEmpty() {
  if ((await User.estimatedDocumentCount()) === 0) await seed({ wipe: false });
}

module.exports = { seed, seedIfEmpty, DEMO };

if (require.main === module) {
  require('dotenv').config();
  const { connectDB, disconnectDB } = require('./db');
  connectDB()
    .then(() => seed())
    .then(disconnectDB)
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
