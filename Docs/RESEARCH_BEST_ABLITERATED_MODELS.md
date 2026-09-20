# Comprehensive Research: Best Abliterated & Uncensored LLMs for Local & Cloud Execution

**Author:** Antigravity Research Agent  
**Date:** September 2026  
**Primary References & Foundations:**
- *Refusal in LLMs is Mediated by a Single Direction* (Arditi et al., 2024 / FailSpy research)
- Hugging Face Model Registries (`huihui-ai`, `mradermacher`, `Sao10K`, `QuantFactory`, `bartowski`)
- Ollama Model Library & GGUF Quantization Specifications

---

## 1. What is Abliteration & Why It Matters

Standard safety-aligned models (like vanilla Qwen2.5, Llama 3.2, or Gemma 2) have an internal refusal mechanism that triggers boilerplate declines (*"I cannot assist with that..."*) even on benign queries like cybersecurity education, fictional storytelling, or medical discussions.

**Abliteration** mathematically identifies the 1-dimensional "refusal vector" within the neural activation space and orthogonalizes the weight matrices to erase the refusal direction. 

**Key Benefits over Fine-Tuning:**
1. **Zero Degradation in IQ:** Unlike uncensored fine-tunes that can suffer from catastrophic forgetting, abliteration preserves 100% of the base model's mathematical, coding, and multilingual knowledge.
2. **Zero Safety Refusals:** Complies with direct prompts, edge cases, roleplay, and uncensored tasks.

---

## 2. Hardware Compatibility Breakdown

### Tier A: Local Real-Time Execution (NVIDIA GTX 1050 Ti 4GB VRAM + 8GB RAM)
*Constraint: Total model size in VRAM must be $\le 2.5\text{ GB}$ to fit 100% on GPU and achieve 20–35 tokens/sec.*

| Model Name | Parameters | VRAM (Q4_K_M) | Best Use Case | Ollama Command / Hugging Face Source |
| :--- | :---: | :---: | :--- | :--- |
| **Qwen 2.5 3B Instruct Abliterated** ⭐ | 3.09B | ~1.9 GB | **Top Pick for Local General Use.** Outstanding reasoning, multilingual support, and general QA. | `ollama run richardyoung/qwen2.5-3b-instruct-abliterated` |
| **Qwen 2.5 Coder 3B Instruct Abliterated** | 3.09B | ~1.9 GB | **Top Pick for Local Coding.** Python, TypeScript, scripts, automation, and debugging. | `ollama run huihui_ai/qwen2.5-coder-3b-instruct-abliterated` |
| **Llama 3.2 3B Instruct Abliterated** | 3.21B | ~2.0 GB | Strong conversational flow, concise summaries, creative dialogue. | `ollama run huihui_ai/llama-3.2-3b-instruct-abliterated`<br>*(Source: `QuantFactory/Llama-3.2-3B-Instruct-abliterated-GGUF`)* |
| **Qwen 2.5 1.5B Instruct Abliterated** | 1.54B | ~1.1 GB | Ultra-fast real-time inference (45+ t/s) for quick background tools and NLP parsing. | `ollama run huihui_ai/qwen2.5-1.5b-instruct-abliterated` |

---

### Tier B: Cloud / Google Colab Execution (Free T4 GPU with 15GB VRAM)
*Constraint: Models up to 14B in 4-bit quantization (~8.5GB VRAM) run with blazing acceleration.*

| Model Name | Parameters | VRAM (Q4_K_M) | Best Use Case | Ollama / Hugging Face Source |
| :--- | :---: | :---: | :--- | :--- |
| **Qwen 2.5 14B Instruct Abliterated** 🏆 | 14.7B | ~8.9 GB | **Frontier-Class Generalist.** Beats standard 70B models on math, structured JSON, translation, and uncensored analysis. | `ollama run huihui_ai/qwen2.5-14b-instruct-abliterated`<br>*(GGUF: `mradermacher/Qwen2.5-14B-Instruct-abliterated-GGUF`)* |
| **Qwen 2.5 7B Instruct Abliterated** | 7.61B | ~4.7 GB | Perfect high-speed workhorse for Colab (fast token generation, high intelligence). | `ollama run huihui_ai/qwen2.5-7b-instruct-abliterated` |
| **Qwen 2.5 Coder 7B Instruct Abliterated** | 7.61B | ~4.7 GB | High-level autonomous coding, large codebase refactoring, and security research. | `ollama run huihui_ai/qwen2.5-coder-7b-instruct-abliterated` |
| **Llama 3.1 8B Instruct Abliterated** | 8.03B | ~5.0 GB | High literary prose quality, 128k context support, nuanced roleplay. | `ollama run huihui_ai/llama3.1-8b-instruct-abliterated` |

---

### Tier C: Creative Writing, Fiction & Roleplay Specialists

| Model Name | Parameters | VRAM (Q4_K_M) | Strengths | Recommended Source |
| :--- | :---: | :---: | :--- | :--- |
| **Stheno L3 8B (v3.2)** (Sao10K) | 8.0B | ~5.1 GB | Gold standard for nuanced creative writing, fiction, character dynamics, and narrative prose. | Hugging Face: `bartowski/L3-8B-Stheno-v3.2-GGUF` |
| **Qwen3 Short Story 4B Uncensored** | 4.0B | ~2.6 GB | Specialized short fiction, fast pacing, creative dialogue generation. | Local GGUF (`mradermacher/Qwen3-Short-Story-Instruct-Uncensored-262K-ctx-4B-GGUF`) |

---

## 3. Recommended Workflow by Task

1. **For everyday coding & chat on your local PC (1050 Ti):**
   ```powershell
   # General knowledge & chat:
   ollama run richardyoung/qwen2.5-3b-instruct-abliterated

   # Coding assistance:
   ollama run huihui_ai/qwen2.5-coder-3b-instruct-abliterated
   ```

2. **For deep research, long document processing, and complex reasoning in Google Colab:**
   ```bash
   # In Google Colab (with T4 GPU runtime):
   ollama run huihui_ai/qwen2.5-14b-instruct-abliterated
   ```
