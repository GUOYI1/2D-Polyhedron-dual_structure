//This file includes some useful mathematical solutions that can be used in WebGL.Three.js and numeric.js need to be included
function GetEdgeNormal2D(vector)
{
    return new THREE.Vector3(-vector.y,vector.x,0).normalize();
}
function Line_intersection_2D(A1,B1,C1,A2,B2,C2)
{
	//A1X+B1Y+C1=A2X+B2Y+C2
	var x=numeric.solve([[A1,B1],[A2,B2]],[-C1,-C2]);
	return x;
} 
//Extension for numeric.js
//Linear_Independent_Group, column vector
function Maxium_Linear_Independent_Group(m){
    'use strict'
    var matrix=new Array(m.length);
    for(var i=0;i<m.length;i++)
        matrix[i]=m[i].slice(0);
    var matrix_T=numeric.transpose(matrix);
    var lead = 0;
    var rows=matrix.length;
    var cols=matrix[0].length;
    var result=[];
    for (var r = 0; r < rows; r++) {
        if (cols <= lead) {
            break;
        }
        var i = r;
        while (Math.abs(matrix[i][lead])<0.00001) {
            i++;
            if (rows == i) {
                i = r;
                lead++;
                if (cols == lead) {
                    break;
                }
            }
        }
        if (cols == lead) break;

        var tmp = matrix[i];
        matrix[i] = matrix[r];
        matrix[r] = tmp;
 
        var val = matrix[r][lead];
        for (var j = 0; j < cols; j++) {
            matrix[r][j] /= val;
        }
        for (var i = r+1; i < rows; i++) {
            val = matrix[i][lead];
            for (var j = 0; j < cols; j++) {
                matrix[i][j] -= val * matrix[r][j];
                // console.log(matrix[i][j]);
            }
        }
        lead++;
    }
    var idx_Independent=[];
    var idx_Depend=[];
    var start=0;
    for(var i=0;i<matrix.length;i++){
        var flag=false;
        for(var j=start;j<matrix[i].length;j++){
            if(matrix[i][j]>0.00001){
                flag=true;
                idx_Independent.push(j);
                result.push(matrix_T[j]);
                start=j+1;
                break;
            }
            else idx_Depend.push(j);
        } 
        if(!flag) break; 
    } 
    return {
        result:numeric.transpose(result),
        idx_Independent:idx_Independent,
        idx_Depend:idx_Depend
    }; 
}