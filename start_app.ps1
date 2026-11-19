# Runs the Streamlit app with the project virtual environment without manual activation.
Set-Location "$PSScriptRoot"
& "$PSScriptRoot\.venv\Scripts\python.exe" -m streamlit run "$PSScriptRoot\app.py"
