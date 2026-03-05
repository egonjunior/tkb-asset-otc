import sys
# importing to try to read the pdf, wait pypdf might not be installed.
try:
    with open('/Users/user/Downloads/Contrato_Parceria_TKB_.pdf', 'rb') as f:
        print("Success opening file")
except Exception as e:
    print(e)
