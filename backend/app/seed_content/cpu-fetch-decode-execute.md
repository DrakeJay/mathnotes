The [logic gates](/lessons/logic-gates) lesson ended with a half-adder — a pile of gates that adds two bits. A CPU is what you get when you keep going: wire up an adder that handles whole numbers, bolt on a few storage cells, and add a controller that reads a list of numbered commands and makes the hardware obey them one at a time. That controller loop — **fetch, decode, execute** — is the heartbeat of every processor ever built.

## The parts

A minimal processor has just a few pieces:

- **Registers** — a handful of tiny, blazing-fast storage cells right inside the CPU (here `R0`–`R3`). All arithmetic happens on registers.
- **The ALU** (Arithmetic Logic Unit) — the gate network that actually computes: add, subtract, compare. It's the half-adder's grown-up cousin.
- **The Program Counter** (`PC`) — holds the address of the next instruction. It's just a register that usually counts up by one.
- **The Instruction Register** (`IR`) — holds the instruction currently being worked on.
- **The Control Unit** — decodes the instruction and flips the switches that route data to the right place.
- **Memory** — a numbered array of cells holding *both* the program and its data. That one memory holds both is the **von Neumann architecture**, and it's why a program can be treated as data (compilers, viruses, and just-in-time compilers all depend on it).

## The cycle

The control unit repeats three steps forever, each one tick of the **clock**:

1. **Fetch.** Copy the word at `MEM[PC]` into `IR`. Bump `PC` by one, so it points at the next instruction.
2. **Decode.** Split the fetched number into an **opcode** (which operation) and its **operands** (which registers or addresses). This is the step that turns a number into a command.
3. **Execute.** Do it — run the ALU, read or write memory, or change `PC` to jump.

Then back to fetch. A 3 GHz processor runs this loop three billion times a second.

## Watch it run

The machine below runs a real program: it sums $5+4+3+2+1$ and stores the answer in memory cell 15. Press **Step** to advance one clock tick at a time and read the narration, or **Run** to let the clock tick on its own.

<demo name="cpu-simulator"></demo>

The key thing to notice: **the instructions are just numbers.** Memory cell 3 holds `40001`. That's not special "code" — it's the number forty thousand and one. Only when the decoder splits it (opcode `4` = ADD, then registers `0` and `1`) does it *become* the instruction `ADD R0, R1`. The encoding here is decimal for legibility — $\text{word} = \text{opcode}\times 10000 + \text{reg}\times 1000 + \text{operand}$ — but a real CPU does exactly this with binary bit-fields.

Things to trace:

- **The loop.** Instructions 3–5 (`ADD`, `SUB`, `JNZ`) repeat five times. `JNZ R1, 3` means "if `R1` isn't zero, set `PC` back to 3" — that backward jump *is* the loop. Watch `PC` snap back to 3 each pass.
- **The ALU lighting up.** It only does work on `ADD` and `SUB`; the other instructions just move data around. Most of what a CPU does is shuffling, not computing.
- **The branch deciding.** On the last pass `R1` reaches 0, `JNZ` declines to jump, and control falls through to `STORE` and `HALT`. That single conditional jump is the atom of every `if`, `while`, and `for` you've ever written.

## Instructions all the way up

This eight-instruction machine is a toy, but nothing about a real CPU is different in kind — only in degree. A modern chip has more registers, hundreds of instruction types, and does arithmetic on 64 bits at once. It overlaps the stages so several instructions are in flight at different phases (**pipelining**), and even runs later instructions early and out of order when it can prove the result is the same. But strip all of that away and the same loop is underneath: fetch a number, decode it, execute it, repeat.

And the jump instruction is quietly the profound one. Fetch-decode-execute with no jumps is just a calculator running a fixed recipe. Add a *conditional* jump — one that consults a value and chooses where to go next — and the machine can loop, branch, and respond to its own computations. That single capability is the line between an adding machine and a universal computer, the same line the [finite automata](/lessons/finite-automata) and [stacks](/lessons/stacks) lessons circle from the theory side.

## The takeaway

A CPU is not magic and it is not clever. It is a very fast, very literal clerk that reads numbered instructions out of memory and does exactly what each number says, three billion times a second. Registers hold the working values, the ALU does the arithmetic that gates make possible, the program counter keeps the place, and one conditional jump turns the whole thing from a calculator into a computer. Everything else — your operating system, your browser, this page — is that loop, running fast enough to look like thought.
