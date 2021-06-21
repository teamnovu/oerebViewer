export function LegalListDirective() {
    'ngInject';

    let directive = {
        restrict: 'E',
        template: require('./legallist.html'),
        scope: {
            documents: '=',
            title: '=',
            xsitype: '=',
            entryicon: '=',
            sortbyofficialnumber: '='
        },
        controller: LegalListController,
        controllerAs: 'list',
        bindToController: true
    };

    return directive;
}

class LegalListController {
    constructor($scope) {
        'ngInject';

        $scope.getSortString = function(document) {
            let officialTitle = document.OfficialTitle && document.OfficialTitle[0].Text;
            let title = document.Title && document.Title[0].Text;
            return ($scope.list.sortbyofficialnumber && document.OfficialNumber || 'xxxxxxxxxx') + (officialTitle ? officialTitle : title) + (!$scope.list.sortbyofficialnumber &&document.OfficialNumber || '');
        }
    }
}
