import os
import glob
import re

files = [
    "dashboard-rendimento.html",
    "selecionar-treinador.html",
    "turmas.html"
]

replacements = {
    r"M\ufffd?dia": "Média",
    r"m\ufffd?dia": "média",
    r"Evolu\ufffd?\ufffd?o": "Evolução",
    r"Avalia\ufffd?\ufffd?o": "Avaliação",
    r"A\ufffd?\ufffd?es": "Ações",
    r"T\ufffd?tico": "Tático",
    r"T\ufffd?cnico": "Técnico",
    r"Gr\ufffd?fico": "Gráfico",
    r"P\ufffd?blico": "Público",
    r"Di\ufffd?rio": "Diário",
    r"di\ufffd?rio": "diário",
    r"S\ufffd?bado": "Sábado",
    r"M\ufffd?dico": "Médico",
    r"Aten\ufffd?\ufffd?o": "Atenção",
    r"Cl\ufffd?nico": "Clínico",
    r"F\ufffd?sico": "Físico",
    r"Lan\ufffd?ar": "Lançar",
    r"S\ufffd?rie": "Série",
    r"s\ufffd?rie": "série",
    r"Frequ\ufffd?ncia": "Frequência",
    r"Card\ufffd?aca": "Cardíaca",
    r"M\ufffd?xima": "Máxima",
    r"Alcan\ufffd?ado": "Alcançado",
    r"Correla\ufffd?\ufffd?o": "Correlação",
    r"Composi\ufffd?\ufffd?o": "Composição",
    r"Circunfer\ufffd?ncia": "Circunferência",
    r"Abd(\ufffd?)men": "Abdômen",
    r"Bra\ufffd?o": "Braço",
    r"Cut\ufffd?nea": "Cutânea",
    r"Tr\ufffd?ceps": "Tríceps",
    r"Les\ufffd?es": "Lesões",
    r"Regi\ufffd?es": "Regiões",
    r"Ocorr\ufffd?ncia": "Ocorrência",
    r"Incid\ufffd?ncia": "Incidência",
    r"M\ufffd?s": "Mês",
    r"Vit\ufffd?ria": "Vitória",
    r"Per?odo": "Período",
    r"In\ufffd?cio": "Início",
    r"Pr\ufffd?xima": "Próxima",
    r"Transi\ufffd?\ufffd?o": "Transição",
    r"M\ufffd?s": "Mês",
    r"\?ltima": "Última",
    r"\?ltimo": "Último",
    r"Equil\ufffd?brio": "Equilíbrio",
    r"Pontua\ufffd?\ufffd?o": "Pontuação",
    r"Val\ufffd?ncia": "Valência",
    r"Pot\ufffd?ncia": "Potência",
    r"Resist\ufffd?ncia": "Resistência",
    r"Aer\ufffd?bia": "Aeróbia",
    r"For\ufffd?a": "Força",
    r"Ac\ufffd?mulo": "Acúmulo",
    r"Sess\ufffd?es": "Sessões",
    r"Dura\ufffd?\ufffd?o": "Duração",
    r"Prontid\ufffd?o": "Prontidão",
    r"Distribui\ufffd?\ufffd?o": "Distribuição",
    r"Psicol\ufffd?gico": "Psicológico",
    r"Visualiza\ufffd?\ufffd?o": "Visualização",
    r"Relat\ufffd?rio": "Relatório",
    r"Per?odo": "Período",
    r"Ades\ufffd?o": "Adesão",
}

for filepath in files:
    if os.path.exists(filepath):
        try:
            with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
                content = f.read()

            for pattern, replacement in replacements.items():
                content = re.sub(pattern, replacement, content, flags=re.IGNORECASE)

            # Manual ? replacements where FFFD was not used
            content = content.replace("Gr?fico", "Gráfico")
            content = content.replace("M?dia", "Média")
            content = content.replace("Evolu??o", "Evolução")
            content = content.replace("Avalia??o", "Avaliação")
            content = content.replace("Di?rio", "Diário")
            content = content.replace("F?sico", "Físico")
            content = content.replace("T?cnico", "Técnico")
            content = content.replace("T?tico", "Tático")
            content = content.replace("S?rie", "Série")
            content = content.replace("Frequ?ncia", "Frequência")
            content = content.replace("Card?aca", "Cardíaca")
            content = content.replace("M?xima", "Máxima")
            content = content.replace("Correla??o", "Correlação")
            content = content.replace("Les?o", "Lesão")
            content = content.replace("Les?es", "Lesões")
            content = content.replace("S?bado", "Sábado")
            content = content.replace("Lan?ar", "Lançar")

            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            
            print(f"Fixed {filepath}")
        except Exception as e:
            print(f"Error on {filepath}: {e}")
