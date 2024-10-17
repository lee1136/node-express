function getFileType(url) {
    // URL에서 파일 이름 추출
    const fileName = url.split('/').pop();
    
    // 파일 확장자 추출 (마지막 '.' 이후의 문자열)
    const fileExtension = fileName.split('.').pop().toLowerCase();

    // 확장자에 따른 파일 형식 구별
    switch (fileExtension) {
        case 'mp4':
            return 'MP4';
        case 'gif':
            return 'GIF';
        case 'webp':
            return 'WEBP';        
        case 'jpg':
        case 'jpeg':
            return 'JPG';
        default:
            return '';
    }
}
