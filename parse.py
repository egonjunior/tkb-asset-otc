import pypdf
reader = pypdf.PdfReader('/Users/user/Downloads/Contrato_Parceria_TKB_.pdf')
text = ""
for page in reader.pages:
    text += page.extract_text() + "\n"
with open("contrato_txt.txt", "w") as f:
    f.write(text)
