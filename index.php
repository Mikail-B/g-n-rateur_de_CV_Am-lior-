<?php
require_once 'vendor/autoload.php';
use Dompdf\Dompdf;
use Dompdf\Options;

function e(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}

function values(string $name): array
{
    $value = $_POST[$name] ?? [];

    if (!is_array($value)) {
        $value = [$value];
    }

    return array_map(fn($item) => e((string) $item), $value);
}

function hasContent(array $items): bool
{
    foreach ($items as $item) {
        if (trim($item) !== '') {
            return true;
        }
    }

    return false;
}

function dateRange(string $start, string $end): string
{
    if ($start !== '' && $end !== '') {
        return "$start - $end";
    }

    return $start !== '' ? $start : $end;
}

$theme = $_POST['themeChoisi'] ?? 'theme-classique';
$theme = in_array($theme, ['theme-classique', 'theme-Bleu', 'theme-Rouge'], true) ? $theme : 'theme-classique';

$nom = e($_POST['Nom'] ?? '');
$prenom = e($_POST['prenom'] ?? '');
$titrepro = e($_POST['titrepro'] ?? '');
$mail = e($_POST['mail'] ?? '');
$tel = e($_POST['tel'] ?? '');
$resumerpro = e($_POST['resumerpro'] ?? '');

$postes = values('poste');
$entreprises = values('entreprise');
$datesD = values('dateD');
$datesF = values('dateF');
$descriptions = values('Description');
$diplomes = values('Diplome');
$etablissements = values('Etablissement');
$datesDiplome = values('DatedDiplome');
$datesFinDiplome = values('DatefDiplome');
$descriptionsFormation = values('Descriptionf');
$competences = values('NC');
$niveaux = values('Niveau');

$experiencesHtml = '';
$experienceCount = max(count($postes), count($entreprises), count($datesD), count($datesF), count($descriptions));

for ($i = 0; $i < $experienceCount; $i++) {
    $poste = $postes[$i] ?? '';
    $entreprise = $entreprises[$i] ?? '';
    $date = dateRange($datesD[$i] ?? '', $datesF[$i] ?? '');
    $description = $descriptions[$i] ?? '';

    if (!hasContent([$poste, $entreprise, $date, $description])) {
        continue;
    }

    $experiencesHtml .= "
                    <div class='item'>
                        <p><strong>$poste</strong></p>
                        <p>$entreprise</p>
                        <p>$date</p>
                        <p>$description</p>
                    </div>
";
}

$formationsHtml = '';
$formationCount = max(count($diplomes), count($etablissements), count($datesDiplome), count($datesFinDiplome), count($descriptionsFormation));

for ($i = 0; $i < $formationCount; $i++) {
    $diplome = $diplomes[$i] ?? '';
    $etablissement = $etablissements[$i] ?? '';
    $date = dateRange($datesDiplome[$i] ?? '', $datesFinDiplome[$i] ?? '');
    $descriptionF = $descriptionsFormation[$i] ?? '';

    if (!hasContent([$diplome, $etablissement, $date, $descriptionF])) {
        continue;
    }

    $formationsHtml .= "
                    <div class='item'>
                        <p><strong>$diplome</strong></p>
                        <p>$etablissement</p>
                        <p>$date</p>
                        <p>$descriptionF</p>
                    </div>
";
}

$competencesHtml = '';
$competenceCount = max(count($competences), count($niveaux));

for ($i = 0; $i < $competenceCount; $i++) {
    $competence = $competences[$i] ?? '';
    $niveau = $niveaux[$i] ?? '';

    if (!hasContent([$competence, $niveau])) {
        continue;
    }

    $competencesHtml .= "
                    <div class='item'>
                        <p><strong>$competence</strong></p>
                        <p>$niveau</p>
                    </div>
";
}

$html="
<!doctype html>
<html lang='fr'>
<head>
<meta charset='UTF-8'>
<style>
@page {
    margin: 0;
}

html,
body {
    height: 297mm;
}

body {
    margin: 0;
    font-family: DejaVu Sans, Arial, sans-serif;
    font-size: 12px;
    color: #222;
}

.cv {
    width: 100%;
    height: 297mm;
    border-collapse: collapse;
    position: relative;
}

.info,
.contenu-cv {
    vertical-align: top;
    padding: 28px;
}

.info {
    width: 34%;
    color: #fff;
}

.side-bg {
    position: fixed;
    top: 0;
    left: 0;
    width: 34%;
    height: 297mm;
    background-color: black;
}

.theme-Bleu .side-bg {
    background-color: rgb(9, 84, 182);
}

.theme-Rouge .side-bg {
    background-color: rgb(182, 9, 9);
}

.contenu-cv {
    width: 66%;
}

h1 {
    font-size: 24px;
    margin: 0 0 6px;
}

h5 {
    font-size: 17px;
    margin: 0 0 10px;
}

.section {
    margin-bottom: 24px;
}

.item {
    margin-bottom: 16px;
}

p {
    margin: 0 0 7px;
    line-height: 1.35;
}

.label {
    font-weight: bold;
    margin-top: 12px;
}
</style>
</head>
<body class='$theme'>
    <div class='side-bg'></div>
    <table class='cv'>
        <tr>
            <td class='info'>
                <h5>Informations générales</h5>
                <h1>$prenom $nom</h1>
                <p>$titrepro</p>
                <p>$mail</p>
                <p>$tel</p>
                <p class='label'>Résumé professionnel</p>
                <p>$resumerpro</p>
            </td>
            <td class='contenu-cv'>
                <div class='section'>
                    <h5>Expériences professionnelles</h5>
                    $experiencesHtml
                </div>
                <div class='section'>
                    <h5>Formations</h5>
                    $formationsHtml
                </div>
                <div class='section'>
                    <h5>Compétences</h5>
                    $competencesHtml
                </div>
            </td>
        </tr>
    </table>
</body>
</html>
";
file_put_contents("debug.html", $html); //génére un html ppour verifié que le pdf se fasse 

$options = new Options();
$options->set('defaultFont', 'DejaVu Sans');

$dompdf = new Dompdf($options);
$dompdf->loadHtml($html, 'UTF-8');
$dompdf->setPaper('A4', 'portrait');
$dompdf->render();
$dompdf->stream("mon-cv.pdf", ["Attachment" => true]);
